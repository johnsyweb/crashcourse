import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulation.module.css';
import { Participant } from '../Participant/Participant';
import ParticipantDisplay from '../Participant/ParticipantDisplay';
import { Course } from '../Course';
import CourseDisplay from '../Course/CourseDisplay';
import CoursePointsView, { CoursePoint } from '../Course/CoursePointsView';
import CourseMetadata from './CourseMetadata';
import Map from '../Map';
import SelectedPointMarker from '../Map/SelectedPointMarker';
import CoursePointsLayer from '../Map/CoursePointsLayer';
import Simulator, { DEFAULT_PARTICIPANTS } from '../Simulator';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import Results from '../Results/Results';
import { usePersistentState } from '../utils/usePersistentState';
import { downloadGPX, generateGPXFilename } from '../GPXFile';
import * as turf from '@turf/turf';
import { createLatitude, createLongitude } from '../utils/coordinates';
import { createShareableUrl } from '../utils/courseSharing';
import { hasLapDetection } from '../Course/CourseWithLapDetection';
import type { LapDetectionParams } from '../Course/CourseWithLapDetection';

// Default pace values in minutes:seconds format
const DEFAULT_MIN_PACE = '12:00'; // slowest
const DEFAULT_MAX_PACE = '2:30'; // fastest

interface CourseSimulationProps {
  coursePoints: LatLngTuple[];
  courseMetadata?: { name?: string; description?: string };
  onReset?: () => void;
  onCoursePointsChange?: (newCoursePoints: LatLngTuple[]) => void;
  onCourseMetadataChange?: (metadata: { name?: string; description?: string }) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface ParticipantProperties {
  id: string;
  position: LatLngTuple;
  elapsedTime: number;
  pace: string;
  cumulativeDistance: number;
  totalDistance: number;
  finished: boolean;
}

const CourseSimulation: React.FC<CourseSimulationProps> = ({
  coursePoints,
  courseMetadata,
  onReset,
  onCoursePointsChange,
  onCourseMetadataChange,
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finishedParticipants, setFinishedParticipants] = useState<Participant[]>([]);
  const [elapsedTime, setElapsedTime] = usePersistentState('ELAPSED_TIME', 0);
  const [activeTab, setActiveTab] = usePersistentState(
    'ACTIVE_TAB',
    'results' as 'results' | 'coursePoints'
  );
  const [selectedPoint, setSelectedPoint] = usePersistentState(
    'SELECTED_POINT',
    null as CoursePoint | null
  );
  const [selectedPoints, setSelectedPoints] = usePersistentState(
    'SELECTED_POINTS',
    [] as CoursePoint[]
  );

  // Clear persistent state when course points change (new course loaded)
  useEffect(() => {
    if (coursePoints.length > 0) {
      // Reset simulation state when new course is loaded
      setParticipants([]);
      setFinishedParticipants([]);
      setElapsedTime(0);
      setSelectedPoint(null);
      // Keep activeTab as it's a UI preference
    }
  }, [coursePoints, setParticipants, setFinishedParticipants, setElapsedTime, setSelectedPoint]);

  // Memoize course creation to prevent unnecessary recalculation
  const course = useMemo(() => {
    try {
      return new Course(coursePoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
      return null;
    }
  }, [coursePoints]);

  // Memoize helper functions
  const parsePaceToSeconds = useCallback((pace: string): number => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds;
  }, []);

  // Convert LatLngTuple[] to CoursePoint[] for CoursePointsLayer
  const convertToCoursePoints = useCallback((points: LatLngTuple[]): CoursePoint[] => {
    const coursePoints: CoursePoint[] = [];

    points.forEach((point, index) => {
      const [latitude, longitude] = point;
      let distanceFromPrevious = 0;
      let bearingFromPrevious: number | null = null;

      if (index > 0) {
        const previousPoint = points[index - 1];
        const [prevLat, prevLon] = previousPoint;

        // Calculate distance using turf.js
        const from = turf.point([prevLon, prevLat]);
        const to = turf.point([longitude, latitude]);
        distanceFromPrevious = turf.distance(from, to, { units: 'meters' });

        // Calculate bearing using turf.js
        bearingFromPrevious = turf.bearing(from, to);
      }

      // Calculate cumulative distance
      const cumulativeDistance =
        coursePoints.reduce((sum, cp) => sum + cp.distanceFromPrevious, 0) + distanceFromPrevious;

      coursePoints.push({
        index,
        latitude: createLatitude(latitude),
        longitude: createLongitude(longitude),
        distanceFromPrevious,
        bearingFromPrevious,
        cumulativeDistance,
      });
    });

    return coursePoints;
  }, []);

  const formatSecondsAsPace = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getRandomPace = useCallback(
    (minPace: string, maxPace: string): string => {
      const minSeconds = parsePaceToSeconds(minPace);
      const maxSeconds = parsePaceToSeconds(maxPace);
      const randomSeconds = Math.floor(Math.random() * (minSeconds - maxSeconds + 1) + maxSeconds);
      return formatSecondsAsPace(randomSeconds);
    },
    [parsePaceToSeconds, formatSecondsAsPace]
  );

  // Initialize default participants
  useEffect(() => {
    if (!course) return;

    try {
      // Create default participants with random paces
      const defaultParticipants = Array(DEFAULT_PARTICIPANTS)
        .fill(null)
        .map(() => {
          const randomPace = getRandomPace(DEFAULT_MIN_PACE, DEFAULT_MAX_PACE);
          return new Participant(course, 0, randomPace);
        });

      setParticipants(defaultParticipants);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create participants');
    }
  }, [course, getRandomPace]);

  // Memoize event handlers
  const handleParticipantCountChange = useCallback(
    (count: number) => {
      if (!course) return;

      setParticipants((prevParticipants) => {
        const currentCount = prevParticipants.length;

        if (count === currentCount) {
          return prevParticipants;
        }

        if (count > currentCount) {
          // Add new participants
          const newParticipants = Array(count - currentCount)
            .fill(null)
            .map(() => {
              const randomPace = getRandomPace(DEFAULT_MIN_PACE, DEFAULT_MAX_PACE);
              return new Participant(course, 0, randomPace);
            });
          return [...prevParticipants, ...newParticipants];
        } else {
          // Remove participants from the end
          return prevParticipants.slice(0, count);
        }
      });
    },
    [course, getRandomPace]
  );

  const handlePaceRangeChange = useCallback(
    (minPace: string, maxPace: string) => {
      if (!course) return;

      const newParticipants = participants.map(() => {
        const randomPace = getRandomPace(minPace, maxPace);
        return new Participant(course, 0, randomPace);
      });

      setParticipants(newParticipants);
    },
    [course, getRandomPace, participants]
  );

  const handleParticipantUpdate = useCallback(
    (updatedParticipants: Participant[]) => {
      if (!course) return;

      // Separate finished and active participants
      const activeParticipants: Participant[] = [];
      const newlyFinished: Participant[] = [];

      updatedParticipants.forEach((participant) => {
        const props = participant.getProperties() as unknown as ParticipantProperties;
        if (props.finished) {
          // Check if this participant is already in finishedParticipants based on ID
          const alreadyFinished = finishedParticipants.some(
            (fp) => (fp.getProperties() as unknown as ParticipantProperties).id === props.id
          );

          if (!alreadyFinished) {
            // Create a new participant with the same properties to preserve the finish state
            const paceWithoutSuffix =
              typeof props.pace === 'string' ? props.pace.replace('/km', '') : '5:00';
            const participantElapsedTime = props.elapsedTime || elapsedTime;

            // Store the original ID before creating the new participant
            const originalId = props.id;

            // Create a new finished participant (this will generate a new ID automatically)
            const finishedParticipant = new Participant(
              course,
              participantElapsedTime,
              paceWithoutSuffix
            );

            // Ensure cumulativeDistance is set correctly to avoid division by zero
            if (props.cumulativeDistance > 0) {
              finishedParticipant.setCumulativeDistance(props.cumulativeDistance);
            } else {
              finishedParticipant.setCumulativeDistance(course.length);
            }

            // Add custom property to track the original participant
            finishedParticipant.setOriginalId(originalId);

            newlyFinished.push(finishedParticipant);
          }
        } else {
          activeParticipants.push(participant);
        }
      });

      setParticipants(activeParticipants);
      if (newlyFinished.length > 0) {
        setFinishedParticipants((prev) => [...prev, ...newlyFinished]);
      }

      // Check if all participants have finished
      const allFinished = activeParticipants.length === 0 && updatedParticipants.length > 0;

      // We don't need to set elapsedTime here, as it would trigger unnecessary re-renders
      // The simulation will be stopped by the Simulator component when it detects the flag
      return allFinished;
    },
    [course, elapsedTime, finishedParticipants]
  );

  const handlePointSelect = (point: CoursePoint | null) => {
    setSelectedPoint(point);
  };

  const handlePointsSelect = useCallback((points: CoursePoint[]) => {
    setSelectedPoints(points);
  }, []);

  const handlePointsDelete = useCallback(
    (pointIndices: number[]) => {
      if (!onCoursePointsChange) {
        console.warn('onCoursePointsChange not provided - cannot delete points');
        return;
      }

      // Sort indices in descending order to avoid index shifting issues
      const sortedIndices = [...pointIndices].sort((a, b) => b - a);

      // Create a new course with the points deleted
      const newCoursePoints = [...coursePoints];
      sortedIndices.forEach((index) => {
        newCoursePoints.splice(index, 1);
      });

      // Clear selected points if any were deleted
      const deletedIndices = new Set(pointIndices);
      const remainingSelectedPoints = selectedPoints.filter((p) => !deletedIndices.has(p.index));
      setSelectedPoints(remainingSelectedPoints);

      // Clear single selected point if it was deleted
      if (selectedPoint && deletedIndices.has(selectedPoint.index)) {
        setSelectedPoint(null);
      }

      onCoursePointsChange(newCoursePoints);
    },
    [coursePoints, onCoursePointsChange, selectedPoints, selectedPoint]
  );

  const handlePointAdd = useCallback(
    (point: [number, number], index?: number) => {
      if (!onCoursePointsChange) {
        console.warn('onCoursePointsChange not provided - cannot add points');
        return;
      }

      try {
        // Create a temporary course to validate the point and get proper insertion logic
        const tempCourse = new Course(coursePoints);
        tempCourse.addPoint(point, index);

        // Get the updated points from the temporary course
        const updatedPoints = tempCourse.getPoints();
        onCoursePointsChange(updatedPoints);
      } catch (error) {
        console.error('Error adding point:', error);
        alert(`Error adding point: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [coursePoints, onCoursePointsChange]
  );

  const handlePointMove = useCallback(
    (index: number, point: [number, number]) => {
      if (!onCoursePointsChange) {
        console.warn('onCoursePointsChange not provided - cannot move points');
        return;
      }

      try {
        // Create a temporary course to validate the point and get proper update logic
        const tempCourse = new Course(coursePoints);
        tempCourse.movePoint(index, point);

        // Get the updated points from the temporary course
        const updatedPoints = tempCourse.getPoints();
        onCoursePointsChange(updatedPoints);
      } catch (error) {
        console.error('Error moving point:', error);
        alert(`Error moving point: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [coursePoints, onCoursePointsChange]
  );

  const handleBatchPointMove = useCallback(
    (updates: Array<{ index: number; point: [number, number] }>) => {
      if (!onCoursePointsChange) {
        console.warn('onCoursePointsChange not provided - cannot move points');
        return;
      }

      try {
        // Create a temporary course and apply all updates
        const tempCourse = new Course(coursePoints);

        updates.forEach(({ index, point }) => {
          tempCourse.movePoint(index, point);
        });

        // Get the updated points from the temporary course
        const updatedPoints = tempCourse.getPoints();
        onCoursePointsChange(updatedPoints);
      } catch (error) {
        console.error('Error moving points:', error);
        alert(`Error moving points: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [coursePoints, onCoursePointsChange]
  );

  const handleResetResults = useCallback(() => {
    setFinishedParticipants([]);
  }, []);

  const handleExportGPX = useCallback(
    (courseName?: string) => {
      try {
        const filename = generateGPXFilename(courseName || courseMetadata?.name);
        downloadGPX(coursePoints, filename, {
          name: courseName || courseMetadata?.name || 'Course',
          description: courseMetadata?.description || 'Exported course from Crash Course Simulator',
          author: 'Crash Course Simulator',
          includeElevation: false,
          includeTimestamps: false,
        });
      } catch (error) {
        console.error('Failed to export GPX:', error);
        setError(error instanceof Error ? error.message : 'Failed to export GPX file');
      }
    },
    [coursePoints, courseMetadata]
  );

  const handleShareCourse = useCallback(() => {
    try {
      // Get lap detection parameters if available
      let lapDetectionParams: LapDetectionParams | undefined;
      if (hasLapDetection(course)) {
        lapDetectionParams = course.getLapDetectionParams();
      }

      const shareUrl = createShareableUrl({
        points: coursePoints,
        metadata: courseMetadata,
        lapDetectionParams,
        version: '1.0',
      });

      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Shareable URL copied to clipboard!\n\nYou can paste this link to share the course.');
      });
    } catch (error) {
      console.error('Failed to share course:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate shareable URL');
    }
  }, [course, coursePoints, courseMetadata]);

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <ErrorBoundary>
        <div className={styles.layout}>
          {/* Desktop/Tablet Layout */}
          <div className={styles.desktopLayout}>
            {/* Left Side - Controls Panel */}
            <div className={styles.controlsSection}>
              <div className={styles.controlsContainer}>
                <div className={styles.controlsHeader}>
                  <button
                    className={styles.resetButton}
                    onClick={onReset}
                    data-testid="reset-button"
                  >
                    Import Different Course
                  </button>
                </div>
                {courseMetadata && onCourseMetadataChange && (
                  <CourseMetadata
                    metadata={courseMetadata}
                    onMetadataChange={onCourseMetadataChange}
                  />
                )}
                {course && (
                  <Simulator
                    course={course}
                    participants={participants}
                    onParticipantUpdate={handleParticipantUpdate}
                    onParticipantCountChange={handleParticipantCountChange}
                    onPaceRangeChange={handlePaceRangeChange}
                    onElapsedTimeChange={setElapsedTime}
                  />
                )}
              </div>
            </div>

            {/* Right Side - Map and Results */}
            <div className={styles.rightSection}>
              {/* Map Panel */}
              <div className={styles.mapPanel}>
                <div className={styles.mapContainer}>
                  {course && (
                    <Map
                      gpsPoints={coursePoints}
                      centerOnPoint={
                        selectedPoint &&
                        typeof selectedPoint.latitude === 'number' &&
                        typeof selectedPoint.longitude === 'number'
                          ? [selectedPoint.latitude, selectedPoint.longitude]
                          : undefined
                      }
                      zoomLevel={selectedPoint ? 18 : undefined}
                    >
                      <CourseDisplay course={course} />
                      {participants.map((participant) => (
                        <ParticipantDisplay key={participant.getId()} participant={participant} />
                      ))}
                      <CoursePointsLayer
                        points={convertToCoursePoints(coursePoints)}
                        selectedIndex={selectedPoint?.index}
                        showAllPoints={!!selectedPoint}
                      />
                      <SelectedPointMarker
                        point={selectedPoint}
                        onPointMove={handlePointMove}
                        draggable={!!selectedPoint}
                      />
                    </Map>
                  )}
                </div>
              </div>

              {/* Results Panel */}
              <div className={styles.resultsPanel}>
                <div className={styles.resultsContainer}>
                  {/* Tab Navigation */}
                  <div className={styles.tabNavigation}>
                    <button
                      className={`${styles.tabButton} ${activeTab === 'results' ? styles.activeTab : ''}`}
                      onClick={() => setActiveTab('results')}
                      aria-selected={activeTab === 'results'}
                    >
                      Results
                    </button>
                    <button
                      className={`${styles.tabButton} ${activeTab === 'coursePoints' ? styles.activeTab : ''}`}
                      onClick={() => setActiveTab('coursePoints')}
                      aria-selected={activeTab === 'coursePoints'}
                    >
                      Course Points
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className={styles.tabContent}>
                    {activeTab === 'results' && course && (
                      <Results
                        participants={finishedParticipants}
                        elapsedTime={elapsedTime}
                        onReset={handleResetResults}
                      />
                    )}
                    {activeTab === 'coursePoints' && course && (
                      <CoursePointsView
                        course={course}
                        courseMetadata={courseMetadata}
                        onPointSelect={handlePointSelect}
                        selectedPointIndex={selectedPoint?.index}
                        onPointsSelect={handlePointsSelect}
                        selectedPointIndices={selectedPoints.map((p) => p.index)}
                        onPointsDelete={handlePointsDelete}
                        onPointAdd={handlePointAdd}
                        onBatchPointMove={handleBatchPointMove}
                        undo={undo}
                        redo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onExportGPX={handleExportGPX}
                        onShareCourse={handleShareCourse}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className={styles.mobileLayout}>
            {/* Map Panel */}
            <div className={styles.mobileMapPanel}>
              <div className={styles.mapContainer}>
                {course && (
                  <Map
                    gpsPoints={coursePoints}
                    centerOnPoint={
                      selectedPoint &&
                      typeof selectedPoint.latitude === 'number' &&
                      typeof selectedPoint.longitude === 'number'
                        ? [selectedPoint.latitude, selectedPoint.longitude]
                        : undefined
                    }
                    zoomLevel={selectedPoint ? 18 : undefined}
                  >
                    <CourseDisplay course={course} />
                    {participants.map((participant) => (
                      <ParticipantDisplay key={participant.getId()} participant={participant} />
                    ))}
                    <CoursePointsLayer
                      points={convertToCoursePoints(coursePoints)}
                      selectedIndex={selectedPoint?.index}
                      showAllPoints={!!selectedPoint}
                    />
                    <SelectedPointMarker
                      point={selectedPoint}
                      onPointMove={handlePointMove}
                      draggable={!!selectedPoint}
                    />
                  </Map>
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className={styles.mobileControlsPanel}>
              <div className={styles.controlsContainer}>
                <div className={styles.controlsHeader}>
                  <button
                    className={styles.resetButton}
                    onClick={onReset}
                    data-testid="reset-button"
                  >
                    Import Different Course
                  </button>
                </div>
                {courseMetadata && onCourseMetadataChange && (
                  <CourseMetadata
                    metadata={courseMetadata}
                    onMetadataChange={onCourseMetadataChange}
                  />
                )}
                {course && (
                  <Simulator
                    course={course}
                    participants={participants}
                    onParticipantUpdate={handleParticipantUpdate}
                    onParticipantCountChange={handleParticipantCountChange}
                    onPaceRangeChange={handlePaceRangeChange}
                    onElapsedTimeChange={setElapsedTime}
                  />
                )}
              </div>
            </div>

            {/* Results Panel */}
            <div className={styles.mobileResultsPanel}>
              <div className={styles.resultsContainer}>
                {/* Tab Navigation */}
                <div className={styles.tabNavigation}>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'results' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('results')}
                    aria-selected={activeTab === 'results'}
                  >
                    Results
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'coursePoints' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('coursePoints')}
                    aria-selected={activeTab === 'coursePoints'}
                  >
                    Course Points
                  </button>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                  {activeTab === 'results' && course && (
                    <Results
                      participants={finishedParticipants}
                      elapsedTime={elapsedTime}
                      onReset={handleResetResults}
                    />
                  )}
                  {activeTab === 'coursePoints' && course && (
                    <CoursePointsView
                      course={course}
                      courseMetadata={courseMetadata}
                      onPointSelect={handlePointSelect}
                      selectedPointIndex={selectedPoint?.index}
                      onPointsSelect={handlePointsSelect}
                      selectedPointIndices={selectedPoints.map((p) => p.index)}
                      onPointsDelete={handlePointsDelete}
                      onPointAdd={handlePointAdd}
                      onBatchPointMove={handleBatchPointMove}
                      undo={undo}
                      redo={redo}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      onExportGPX={handleExportGPX}
                      onShareCourse={handleShareCourse}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default CourseSimulation;
