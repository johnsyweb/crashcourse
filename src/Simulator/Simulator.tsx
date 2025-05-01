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
        <h3 className={styles.sectionTitle}>Simulator Controls</h3>
        
        {/* Course Information */}
        <div className={styles.infoSection}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Course Length:</span>
            <span className={styles.infoValue}>{course ? (course.length / 1000).toFixed(2) : 0} km</span>
          </div>
        </div>
        
        {/* Control Sections */}
        <div className={styles.controlSections}>
          {/* Participant Control Section */}
          <div className={styles.controlSection}>
            <div className={styles.controlHeader}>Participants</div>
            <div className={styles.controlContent}>
              <div className={styles.controlItem}>
                <label htmlFor="participantCount" className={styles.controlLabel}>Count:</label>
                <div className={styles.controlInputGroup}>
                  <button
                    className={styles.controlButton}
                    onClick={decreaseParticipantCount}
                    disabled={participantCount <= 1}
                    title="Decrease Participants"
                    aria-label="Decrease number of participants"
                  >
                    −
                  </button>
                  <input
                    id="participantCount"
                    type="number"
                    min="1"
                    value={participantCount}
                    onChange={handleParticipantCountChange}
                    aria-label="Number of participants"
                    className={styles.controlInput}
                  />
                  <button
                    className={styles.controlButton}
                    onClick={increaseParticipantCount}
                    title="Increase Participants"
                    aria-label="Increase number of participants"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Timer Control Section - Use the existing ElapsedTime component */}
          <div className={styles.controlSection}>
            <div className={styles.controlHeader}>Simulation Time</div>
            <div className={styles.controlContent}>
              <ElapsedTime
                onElapsedTimeChange={handleElapsedTimeChange}
                initialElapsedTime={0}
              />
            </div>
          </div>
        </div>
        
        {/* Unified Keyboard Shortcuts */}
        <div className={styles.keyboardShortcuts}>
          <div className={styles.shortcutsHeader}>Keyboard Shortcuts</div>
          <div className={styles.shortcutsGrid}>
            <div className={styles.shortcutGroup}>
              <div className={styles.shortcutGroupTitle}>Participants</div>
              <div className={styles.shortcut}>
                <kbd>[</kbd> <span>Decrease count</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>]</kbd> <span>Increase count</span>
              </div>
            </div>
            <div className={styles.shortcutGroup}>
              <div className={styles.shortcutGroupTitle}>Simulation</div>
              <div className={styles.shortcut}>
                <kbd>P</kbd> <span>Play</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>S</kbd> <span>Stop</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>R</kbd> <span>Reset</span>
              </div>
            </div>
            <div className={styles.shortcutGroup}>
              <div className={styles.shortcutGroupTitle}>Speed</div>
              <div className={styles.shortcut}>
                <kbd>-</kbd> <span>Decrease</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>+</kbd> <span>Increase</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
