import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulation.module.css';
import { Participant } from '../Participant/Participant';
import ParticipantDisplay from '../Participant/ParticipantDisplay';
import { Course } from '../Course';
import CourseDisplay from '../Course/CourseDisplay';
import Map from '../Map';
import Simulator, { DEFAULT_PARTICIPANTS } from '../Simulator';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import Results from '../Results/Results';

// Default pace values in minutes:seconds format
const DEFAULT_MIN_PACE = '12:00'; // slowest
const DEFAULT_MAX_PACE = '2:30'; // fastest

interface CourseSimulationProps {
  coursePoints: LatLngTuple[];
  onReset?: () => void;
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

const CourseSimulation: React.FC<CourseSimulationProps> = ({ coursePoints, onReset }) => {
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finishedParticipants, setFinishedParticipants] = useState<Participant[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const handleResetResults = useCallback(() => {
    setFinishedParticipants([]);
  }, []);

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <ErrorBoundary>
        <button className={styles.resetButton} onClick={onReset} data-testid="reset-button">
          Import Different Course
        </button>
        <div className={styles.gridLayout}>
          <div className={styles.mainContent}>
            <div className={styles.mapContainer}>
              {course && (
                <Map gpsPoints={coursePoints}>
                  <CourseDisplay course={course} />
                  {participants.map((participant) => (
                    <ParticipantDisplay key={participant.getId()} participant={participant} />
                  ))}
                </Map>
              )}
            </div>

            <div className={styles.controlsContainer}>
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

          <div className={styles.resultsContainer}>
            {course && (
              <Results
                participants={finishedParticipants}
                elapsedTime={elapsedTime}
                onReset={handleResetResults}
              />
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default CourseSimulation;
