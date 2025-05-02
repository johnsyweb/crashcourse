import React, { useState, useEffect } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulation.module.css';
import { Participant } from '../Participant/Participant';
import ParticipantDisplay from '../Participant/ParticipantDisplay';
import { Course, CourseDisplay } from '../Course';
import Map from '../Map';
import Simulator from '../Simulator';

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
  const [course, setCourse] = useState<Course | null>(null);
  const [participantCount, setParticipantCount] = useState(2); // Default to 2 participants
  const [minPace, setMinPace] = useState(DEFAULT_MIN_PACE);
  const [maxPace, setMaxPace] = useState(DEFAULT_MAX_PACE);

  // Helper to generate a random pace between min and max
  const getRandomPace = (min: string, max: string): string => {
    // Convert both paces to seconds
    const [minMinutes, minSeconds] = min.split(':').map(Number);
    const [maxMinutes, maxSeconds] = max.split(':').map(Number);

    const minTotalSeconds = minMinutes * 60 + minSeconds;
    const maxTotalSeconds = maxMinutes * 60 + maxSeconds;

    // Ensure min is always greater than max (slower pace has higher time)
    const adjustedMinSeconds = Math.max(minTotalSeconds, maxTotalSeconds);
    const adjustedMaxSeconds = Math.min(minTotalSeconds, maxTotalSeconds);

    // Generate random seconds between adjusted min and max
    const randomSeconds = Math.floor(
      Math.random() * (adjustedMinSeconds - adjustedMaxSeconds + 1) + adjustedMaxSeconds
    );

    // Convert back to MM:SS format
    const minutes = Math.floor(randomSeconds / 60);
    const seconds = randomSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize the course from GPS points
  useEffect(() => {
    try {
      const newCourse = new Course(coursePoints);
      setCourse(newCourse);
      setError(null);
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  }, [coursePoints]);

  // Initialize participants
  useEffect(() => {
    if (course) {
      // Create multiple participants based on participantCount
      const newParticipants: Participant[] = [];
      for (let i = 0; i < participantCount; i++) {
        // Assign random pace to each participant within the min/max range
        const randomPace = getRandomPace(minPace, maxPace);
        newParticipants.push(new Participant(coursePoints, 0, randomPace));
      }
      setParticipants(newParticipants);
    }
  }, [course, coursePoints, participantCount, minPace, maxPace]);

  const handleParticipantUpdate = (updatedParticipants: Participant[]) => {
    setParticipants([...updatedParticipants]);
  };

  const handleParticipantCountChange = (count: number) => {
    setParticipantCount(count);
  };

  const handlePaceRangeChange = (newMinPace: string, newMaxPace: string) => {
    setMinPace(newMinPace);
    setMaxPace(newMaxPace);
  };

  return (
    <div className={styles.courseSimulation}>
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.simulationControls}>
        <h2 className={styles.title}>Course Simulation</h2>
        <button onClick={onReset} className={styles.resetButton}>
          Import Different Course
        </button>
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.controlsContainer}>
          <Simulator
            course={course}
            participants={participants}
            onParticipantUpdate={handleParticipantUpdate}
            onParticipantCountChange={handleParticipantCountChange}
            onPaceRangeChange={handlePaceRangeChange}
          />
        </div>

        <div className={styles.mapContainer}>
          <Map gpsPoints={coursePoints}>
            {course && (
              <>
                <CourseDisplay course={course} />
                {participants.map((participant, index) => (
                  <ParticipantDisplay key={index} participant={participant} />
                ))}
              </>
            )}
          </Map>
        </div>
      </div>
    </div>
  );
};

export default CourseSimulation;
