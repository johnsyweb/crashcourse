import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Course } from '../Course';
import { Participant } from '../Participant';
import ElapsedTime from '../ElapsedTime';
import styles from './Simulator.module.css';

interface SimulatorProps {
  course: Course | null;
  participants?: Participant[];
  onParticipantUpdate?: (participants: Participant[]) => void;
  onParticipantCountChange?: (count: number) => void;
}

const Simulator: React.FC<SimulatorProps> = ({
  course,
  participants = [],
  onParticipantUpdate,
  onParticipantCountChange,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [participantCount, setParticipantCount] = useState(
    participants.length || 2,
  );
  // Use a ref to track if we need to update participants
  const participantsNeedUpdate = useRef(false);

  // Update participant count when participants array changes
  useEffect(() => {
    setParticipantCount(participants.length);
  }, [participants.length]);

  // Memoize the participant update function to avoid it changing on every render
  const updateParticipants = useCallback(
    (time: number) => {
      if (!participants.length) return;

      participants.forEach((participant) => {
        participant.updateElapsedTime(time);
      });

      if (onParticipantUpdate) {
        onParticipantUpdate([...participants]);
      }
    },
    [participants, onParticipantUpdate],
  );

  // Handle elapsed time changes
  useEffect(() => {
    if (participantsNeedUpdate.current) {
      updateParticipants(elapsedTime);
      participantsNeedUpdate.current = false;
    }
  }, [elapsedTime, updateParticipants]);

  const handleElapsedTimeChange = (newElapsedTime: number) => {
    setElapsedTime(newElapsedTime);
    participantsNeedUpdate.current = true;
  };

  const handleParticipantCountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const count = Math.max(1, parseInt(e.target.value, 10) || 1);
    setParticipantCount(count);
    if (onParticipantCountChange) {
      onParticipantCountChange(count);
    }
  };

  return (
    <div className={styles.simulatorContainer}>
      <div className={styles.simulatorControls}>
        <h3>Simulator Controls</h3>
        <div className={styles.courseInfo}>
          <p>
            Course Length: {course ? (course.length / 1000).toFixed(2) : 0} km
          </p>
          <div className={styles.participantControl}>
            <label htmlFor="participantCount">Participants:</label>
            <input
              id="participantCount"
              type="number"
              min="1"
              value={participantCount}
              onChange={handleParticipantCountChange}
              aria-label="Number of participants"
              className={styles.participantCountInput}
            />
          </div>
        </div>

        <ElapsedTime
          onElapsedTimeChange={handleElapsedTimeChange}
          initialElapsedTime={0}
        />
      </div>
    </div>
  );
};

export default Simulator;
