import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Course } from '../Course';
import { Participant } from '../Participant';
import ElapsedTime from '../ElapsedTime';
import styles from './Simulator.module.css';

interface SimulatorProps {
  course: Course | null;
  participants?: Participant[];
  onParticipantUpdate?: (participants: Participant[]) => void;
}

const Simulator: React.FC<SimulatorProps> = ({
  course,
  participants = [],
  onParticipantUpdate,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // Use a ref to track if we need to update participants
  const participantsNeedUpdate = useRef(false);

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
    setIsRunning(newElapsedTime > 0);
    participantsNeedUpdate.current = true;
  };

  const handleReset = () => {
    setElapsedTime(0);
    setIsRunning(false);
    updateParticipants(0);
  };

  return (
    <div className={styles.simulatorContainer}>
      <div className={styles.simulatorControls}>
        <h3>Simulator Controls</h3>
        <div className={styles.courseInfo}>
          <p>
            Course Length: {course ? (course.length / 1000).toFixed(2) : 0} km
          </p>
          <p>Participants: {participants.length}</p>
        </div>

        <ElapsedTime
          onElapsedTimeChange={handleElapsedTimeChange}
          initialElapsedTime={0}
        />

        {isRunning && (
          <button className={styles.resetButton} onClick={handleReset}>
            Reset Simulation
          </button>
        )}
      </div>
    </div>
  );
};

export default Simulator;
