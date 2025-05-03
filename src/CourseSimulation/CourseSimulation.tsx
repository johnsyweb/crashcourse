import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulation.module.css';
import { Participant } from '../Participant/Participant';
import ParticipantDisplay from '../Participant/ParticipantDisplay';
import { Course } from '../Course';
import CourseDisplay from '../Course/CourseDisplay';
import Map from '../Map';
import Simulator from '../Simulator';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

// Default pace values in minutes:seconds format
const DEFAULT_MIN_PACE = '12:00'; // slowest
const DEFAULT_MAX_PACE = '2:30'; // fastest

interface CourseSimulationProps {
  coursePoints: LatLngTuple[];
  onReset: () => void;
}

const CourseSimulation: React.FC<CourseSimulationProps> = ({ coursePoints, onReset }) => {
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

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
      // Create two default participants with random paces
      const defaultParticipants = Array(2)
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

      const newParticipants = Array(count)
        .fill(null)
        .map(() => {
          const randomPace = getRandomPace(DEFAULT_MIN_PACE, DEFAULT_MAX_PACE);
          return new Participant(course, 0, randomPace);
        });

      setParticipants(newParticipants);
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

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.courseSimulation}>
      <div className={styles.simulationControls}>
        <h2 className={styles.title}>Course Simulation</h2>
        <button className={styles.resetButton} onClick={onReset}>
          Import Different Course
        </button>
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.mapContainer}>
          <Map gpsPoints={coursePoints}>
            <CourseDisplay course={course} />
            {participants.map((participant, index) => (
              <ParticipantDisplay key={index} participant={participant} />
            ))}
          </Map>
        </div>

        <div className={styles.controlsContainer}>
          <ErrorBoundary>
            <Simulator
              course={course}
              participants={participants}
              onParticipantUpdate={setParticipants}
              onParticipantCountChange={handleParticipantCountChange}
              onPaceRangeChange={handlePaceRangeChange}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default CourseSimulation;
