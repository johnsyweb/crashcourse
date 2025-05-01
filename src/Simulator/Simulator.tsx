import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Course } from '../Course';
import { Participant } from '../Participant';
import ElapsedTime from '../ElapsedTime';
import styles from './Simulator.module.css';

// Constants for participant configuration
const MIN_PARTICIPANTS = 1;
const MAX_PARTICIPANTS = 2000;
const DEFAULT_PARTICIPANTS = 2;

// Constants for pace configuration
const DEFAULT_MIN_PACE = '12:00'; // slowest pace (minutes:seconds per km)
const DEFAULT_MAX_PACE = '2:30';  // fastest pace (minutes:seconds per km)

// Helper function to format numbers with locale-specific thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-AU');
};

// Helper for pace validation and formatting
const formatPaceString = (pace: string): string => {
  const [minutes, seconds] = pace.split(':').map(Number);
  const formattedSeconds = seconds.toString().padStart(2, '0');
  return `${minutes}:${formattedSeconds}`;
};

// Convert pace string to seconds for comparison
const paceToSeconds = (pace: string): number => {
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes * 60 + seconds;
};

interface SimulatorProps {
  course: Course | null;
  participants?: Participant[];
  onParticipantUpdate?: (participants: Participant[]) => void;
  onParticipantCountChange?: (count: number) => void;
  onPaceRangeChange?: (minPace: string, maxPace: string) => void;
}

const Simulator: React.FC<SimulatorProps> = ({
  course,
  participants = [],
  onParticipantUpdate,
  onParticipantCountChange,
  onPaceRangeChange,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [participantCount, setParticipantCount] = useState(
    participants.length || DEFAULT_PARTICIPANTS,
  );
  const [minPace, setMinPace] = useState(DEFAULT_MIN_PACE);
  const [maxPace, setMaxPace] = useState(DEFAULT_MAX_PACE);
  
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
      const newCount = Math.min(MAX_PARTICIPANTS, prevCount + 1);
      if (onParticipantCountChange) {
        onParticipantCountChange(newCount);
      }
      return newCount;
    });
  }, [onParticipantCountChange]);

  // Function to decrease participant count
  const decreaseParticipantCount = useCallback(() => {
    setParticipantCount((prevCount) => {
      const newCount = Math.max(MIN_PARTICIPANTS, prevCount - 1);
      if (onParticipantCountChange) {
        onParticipantCountChange(newCount);
      }
      return newCount;
    });
  }, [onParticipantCountChange]);

  // Handle pace changes and ensure min <= max
  const handleMinPaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinPace = e.target.value;
    const formattedMinPace = formatPaceString(newMinPace);
    
    // Ensure min pace is slower than or equal to max pace
    if (paceToSeconds(formattedMinPace) >= paceToSeconds(maxPace)) {
      setMinPace(formattedMinPace);
      
      if (onPaceRangeChange) {
        onPaceRangeChange(formattedMinPace, formattedMinPace);
      }
    } else {
      setMinPace(formattedMinPace);
      
      if (onPaceRangeChange) {
        onPaceRangeChange(formattedMinPace, maxPace);
      }
    }
  };

  const handleMaxPaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxPace = e.target.value;
    const formattedMaxPace = formatPaceString(newMaxPace);
    
    // Ensure max pace is faster than or equal to min pace
    if (paceToSeconds(formattedMaxPace) <= paceToSeconds(minPace)) {
      setMaxPace(formattedMaxPace);
      
      if (onPaceRangeChange) {
        onPaceRangeChange(formattedMaxPace, formattedMaxPace);
      }
    } else {
      setMaxPace(formattedMaxPace);
      
      if (onPaceRangeChange) {
        onPaceRangeChange(minPace, formattedMaxPace);
      }
    }
  };

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
    const rawValue = parseInt(e.target.value, 10) || MIN_PARTICIPANTS;
    const count = Math.max(
      MIN_PARTICIPANTS,
      Math.min(MAX_PARTICIPANTS, rawValue),
    );
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
            <span className={styles.infoValue}>
              {course ? (course.length / 1000).toFixed(2) : 0} km
            </span>
          </div>
        </div>

        {/* Control Sections */}
        <div className={styles.controlSections}>
          {/* Participant Control Section */}
          <div className={styles.controlSection}>
            <div className={styles.controlHeader}>Participants</div>
            <div className={styles.controlContent}>
              <div className={styles.controlItem}>
                <label
                  htmlFor="participantCount"
                  className={styles.controlLabel}
                >
                  Count: ({formatNumber(MIN_PARTICIPANTS)}-
                  {formatNumber(MAX_PARTICIPANTS)})
                </label>
                <div className={styles.controlInputGroup}>
                  <button
                    className={styles.controlButton}
                    onClick={decreaseParticipantCount}
                    disabled={participantCount <= MIN_PARTICIPANTS}
                    title="Decrease Participants"
                    aria-label="Decrease number of participants"
                  >
                    −
                  </button>
                  <input
                    id="participantCount"
                    type="number"
                    min={MIN_PARTICIPANTS}
                    max={MAX_PARTICIPANTS}
                    value={participantCount}
                    onChange={handleParticipantCountChange}
                    aria-label="Number of participants"
                    title="Number of participants between 1 and 2,000"
                    className={styles.controlInput}
                    placeholder="Enter participant count"
                  />
                  <button
                    className={styles.controlButton}
                    onClick={increaseParticipantCount}
                    disabled={participantCount >= MAX_PARTICIPANTS}
                    title="Increase Participants"
                    aria-label="Increase number of participants"
                  >
                    +
                  </button>
                </div>
                <div className={styles.rangeIndicator}>
                  <input
                    type="range"
                    min={MIN_PARTICIPANTS}
                    max={MAX_PARTICIPANTS}
                    value={participantCount}
                    onChange={handleParticipantCountChange}
                    className={styles.rangeSlider}
                    aria-label="Adjust number of participants"
                    title="Slide to adjust number of participants"
                  />
                  <div className={styles.rangeLabels}>
                    <span>{formatNumber(MIN_PARTICIPANTS)}</span>
                    <span>{formatNumber(MAX_PARTICIPANTS)}</span>
                  </div>
                </div>
              </div>
              
              {/* Pace Range Controls */}
              <div className={styles.controlItem}>
                <label className={styles.controlLabel}>Participant Pace Range</label>
                <div className={styles.paceControlGroup}>
                  <div className={styles.paceControl}>
                    <label htmlFor="minPace" className={styles.paceLabel}>
                      Slowest Pace:
                    </label>
                    <input
                      id="minPace"
                      type="text"
                      pattern="[0-9]+:[0-5][0-9]"
                      value={minPace}
                      onChange={handleMinPaceChange}
                      className={styles.paceInput}
                      placeholder="MM:SS"
                      title="Slowest pace in minutes:seconds format (e.g., 12:00)"
                      aria-label="Slowest pace in minutes and seconds per kilometer"
                    />
                    <span className={styles.paceUnit}>/km</span>
                  </div>
                  <div className={styles.paceControl}>
                    <label htmlFor="maxPace" className={styles.paceLabel}>
                      Fastest Pace:
                    </label>
                    <input
                      id="maxPace"
                      type="text"
                      pattern="[0-9]+:[0-5][0-9]"
                      value={maxPace}
                      onChange={handleMaxPaceChange}
                      className={styles.paceInput}
                      placeholder="MM:SS"
                      title="Fastest pace in minutes:seconds format (e.g., 2:30)"
                      aria-label="Fastest pace in minutes and seconds per kilometer"
                    />
                    <span className={styles.paceUnit}>/km</span>
                  </div>
                </div>
                <div className={styles.paceInfo}>
                  Participants will be assigned random paces between these values.
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
