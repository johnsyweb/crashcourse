import React, { useState, useEffect } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulation.module.css';
import { Participant } from '../Participant/Participant';
import ParticipantDisplay from '../Participant/ParticipantDisplay';
import { Course, CourseDisplay } from '../Course';
import Map from '../Map';
import Simulator from '../Simulator';

interface CourseSimulationProps {
  coursePoints: LatLngTuple[];
  onReset: () => void;
}

// Helper function to generate random pace between min and max minutes per km
const generateRandomPace = (minPace: number, maxPace: number): string => {
  // Convert min and max pace to seconds
  const minSeconds = minPace * 60;
  const maxSeconds = maxPace * 60;

  // Generate random seconds between min and max
  const totalSeconds =
    Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;

  // Convert back to minutes:seconds format
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const CourseSimulation: React.FC<CourseSimulationProps> = ({
  coursePoints,
  onReset,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [course, setCourse] = useState<Course | null>(null);

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
      // Create 100 participants with random paces between 2:30/km and 18:00/km
      const newParticipants: Participant[] = [];

      // Define min and max paces (in minutes per km)
      const MIN_PACE = 2.5; // 2:30 min/km
      const MAX_PACE = 18; // 18:00 min/km

      // Create 100 participants
      for (let i = 0; i < 100; i++) {
        const randomPace = generateRandomPace(MIN_PACE, MAX_PACE);
        const participant = new Participant(coursePoints, 0, randomPace);
        newParticipants.push(participant);
      }

      setParticipants(newParticipants);
    }
  }, [course, coursePoints]);

  const handleParticipantUpdate = (updatedParticipants: Participant[]) => {
    setParticipants([...updatedParticipants]);
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

      <Simulator
        course={course}
        participants={participants}
        onParticipantUpdate={handleParticipantUpdate}
      />

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
  );
};

export default CourseSimulation;
