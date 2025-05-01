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

const CourseSimulation: React.FC<CourseSimulationProps> = ({
  coursePoints,
  onReset,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [participantCount, setParticipantCount] = useState(2); // Default to 2 participants

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
        newParticipants.push(new Participant(coursePoints));
      }
      setParticipants(newParticipants);
    }
  }, [course, coursePoints, participantCount]);

  const handleParticipantUpdate = (updatedParticipants: Participant[]) => {
    setParticipants([...updatedParticipants]);
  };

  const handleParticipantCountChange = (count: number) => {
    setParticipantCount(count);
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
        onParticipantCountChange={handleParticipantCountChange}
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
