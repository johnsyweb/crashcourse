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
const DEFAULT_MAX_PACE = '2:30'; // fastest pace (minutes:seconds per km)
const PACE_CHANGE_SECONDS = 30; // amount to increase/decrease pace with keyboard shortcuts

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

// Convert seconds to pace string
const secondsToPace = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  const [paceError, setPaceError] = useState<string | null>(null);

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

  // Validate the pace range and ensure fastest < slowest
  const validatePaceRange = (slow: string, fast: string): boolean => {
    const slowSeconds = paceToSeconds(slow);
    const fastSeconds = paceToSeconds(fast);

    // Both must be valid pace strings and fastSeconds must be less than slowSeconds
    // (since a faster pace means fewer seconds per km)
    return slowSeconds > 0 && fastSeconds > 0 && fastSeconds < slowSeconds;
  };

  // Functions for increasing and decreasing pace values
  const increasePace = useCallback(
    (paceType: 'min' | 'max') => {
      const currentPace = paceType === 'min' ? minPace : maxPace;
      const seconds = paceToSeconds(currentPace);

      // Increase pace (which means decreasing the seconds, as faster pace = less time)
      const newSeconds = Math.max(30, seconds - PACE_CHANGE_SECONDS); // Ensure at least 30 seconds
      const newPace = secondsToPace(newSeconds);

      if (paceType === 'min') {
        setMinPace(newPace);
        if (validatePaceRange(newPace, maxPace)) {
          setPaceError(null);
          if (onPaceRangeChange) {
            onPaceRangeChange(newPace, maxPace);
          }
        } else {
          setPaceError('Slowest pace must be greater than fastest pace');
        }
      } else if (paceType === 'max') {
        setMaxPace(newPace);
        if (validatePaceRange(minPace, newPace)) {
          setPaceError(null);
          if (onPaceRangeChange) {
            onPaceRangeChange(minPace, newPace);
          }
        } else {
          setPaceError('Fastest pace must be less than slowest pace');
        }
      }
    },
    [minPace, maxPace, onPaceRangeChange],
  );

  const decreasePace = useCallback(
    (paceType: 'min' | 'max') => {
      const currentPace = paceType === 'min' ? minPace : maxPace;
      const seconds = paceToSeconds(currentPace);

      // Decrease pace (which means increasing the seconds, as slower pace = more time)
      const newSeconds = seconds + PACE_CHANGE_SECONDS;
      const newPace = secondsToPace(newSeconds);

      if (paceType === 'min') {
        setMinPace(newPace);
        if (validatePaceRange(newPace, maxPace)) {
          setPaceError(null);
          if (onPaceRangeChange) {
            onPaceRangeChange(newPace, maxPace);
          }
        } else {
          setPaceError('Slowest pace must be greater than fastest pace');
        }
      } else if (paceType === 'max') {
        setMaxPace(newPace);
        if (validatePaceRange(minPace, newPace)) {
          setPaceError(null);
          if (onPaceRangeChange) {
            onPaceRangeChange(minPace, newPace);
          }
        } else {
          setPaceError('Fastest pace must be less than slowest pace');
        }
      }
    },
    [minPace, maxPace, onPaceRangeChange],
  );

  // Handle pace changes and ensure min <= max
  const handleMinPaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinPace = e.target.value;
    const formattedMinPace = formatPaceString(newMinPace);

    // Ensure min pace is slower than or equal to max pace
    if (/^\d+:\d{1,2}$/.test(newMinPace)) {
      setMinPace(formattedMinPace);

      // Validate the pace range
      if (validatePaceRange(formattedMinPace, maxPace)) {
        setPaceError(null);
        if (onPaceRangeChange) {
          onPaceRangeChange(formattedMinPace, maxPace);
        }
      } else {
        setPaceError('Slowest pace must be greater than fastest pace');
      }
    }
  };

  const handleMaxPaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxPace = e.target.value;
    const formattedMaxPace = formatPaceString(newMaxPace);

    // Ensure max pace is faster than or equal to min pace
    if (/^\d+:\d{1,2}$/.test(newMaxPace)) {
      setMaxPace(formattedMaxPace);

      // Validate the pace range
      if (validatePaceRange(minPace, formattedMaxPace)) {
        setPaceError(null);
        if (onPaceRangeChange) {
          onPaceRangeChange(minPace, formattedMaxPace);
        }
      } else {
        setPaceError('Fastest pace must be less than slowest pace');
      }
    }
  };

  // Handle keyboard events for participant count and pace adjustments
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid triggering when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Participant count shortcuts
      if (event.key === '[' || event.key === '{') {
        decreaseParticipantCount();
      } else if (event.key === ']' || event.key === '}') {
        increaseParticipantCount();
      }

      // Pace adjustment shortcuts for slowest pace
      else if (event.key === 'q' || event.key === 'Q') {
        decreasePace('min'); // Make slowest pace even slower (+30s)
      } else if (event.key === 'w' || event.key === 'W') {
        increasePace('min'); // Make slowest pace faster (-30s)
      }

      // Pace adjustment shortcuts for fastest pace
      else if (event.key === 'a' || event.key === 'A') {
        decreasePace('max'); // Make fastest pace slower (+30s)
      } else if (event.key === 's' || event.key === 'S') {
        increasePace('max'); // Make fastest pace even faster (-30s)
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    increaseParticipantCount,
    decreaseParticipantCount,
    increasePace,
    decreasePace,
  ]);

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
                <label className={styles.controlLabel}>
                  Participant Pace Range
                </label>
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
                {paceError && (
                  <div className={styles.errorMessage}>{paceError}</div>
                )}
                <div className={styles.paceInfo}>
                  Participants will be assigned random paces between these
                  values.
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
            <div className={styles.shortcutGroup}>
              <div className={styles.shortcutGroupTitle}>Pace</div>
              <div className={styles.shortcut}>
                <kbd>q</kbd> <span>Slower slowest pace (+30s)</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>w</kbd> <span>Faster slowest pace (-30s)</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>a</kbd> <span>Slower fastest pace (+30s)</span>
              </div>
              <div className={styles.shortcut}>
                <kbd>s</kbd> <span>Faster fastest pace (-30s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
