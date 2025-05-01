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

  // Function to increase participant count
  const increaseParticipantCount = useCallback(() => {
    setParticipantCount((prevCount) => {
      const newCount = prevCount + 1;
      if (onParticipantCountChange) {
        onParticipantCountChange(newCount);
      }
      return newCount;
    });
  }, [onParticipantCountChange]);

  // Function to decrease participant count
  const decreaseParticipantCount = useCallback(() => {
    setParticipantCount((prevCount) => {
      const newCount = Math.max(1, prevCount - 1);
      if (onParticipantCountChange) {
        onParticipantCountChange(newCount);
      }
      return newCount;
    });
  }, [onParticipantCountChange]);

  // Handle keyboard events for participant count
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid triggering when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === '[' || event.key === '{') {
        decreaseParticipantCount();
      } else if (event.key === ']' || event.key === '}') {
        increaseParticipantCount();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [increaseParticipantCount, decreaseParticipantCount]);

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
            <div className={styles.participantCountWrapper}>
              <button
                className={styles.participantCountButton}
                onClick={decreaseParticipantCount}
                disabled={participantCount <= 1}
                title="Decrease Participants ([)"
                aria-label="Decrease number of participants"
              >
                -
              </button>
              <input
                id="participantCount"
                type="number"
                min="1"
                value={participantCount}
                onChange={handleParticipantCountChange}
                aria-label="Number of participants"
                className={styles.participantCountInput}
              />
              <button
                className={styles.participantCountButton}
                onClick={increaseParticipantCount}
                title="Increase Participants (])"
                aria-label="Increase number of participants"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className={styles.keyboardHelp}>
          Keyboard: <kbd>[</kbd> Fewer, <kbd>]</kbd> More Participants
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
