import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Course, CourseWithLapDetection } from '../Course';
import { Participant } from '../Participant';
import ElapsedTime from '../ElapsedTime';
import ControlCard from './ControlCard';
import styles from './Simulator.module.css';
import { usePersistentState } from '../utils/usePersistentState';

// Constants for participant configuration
const MIN_PARTICIPANTS = 1;
const MAX_PARTICIPANTS = 2000;
export const DEFAULT_PARTICIPANTS = 200;

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
  onElapsedTimeChange?: (time: number) => void;
}

const Simulator: React.FC<SimulatorProps> = ({
  course,
  participants = [],
  onParticipantUpdate,
  onParticipantCountChange,
  onPaceRangeChange,
  onElapsedTimeChange,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [participantCount, setParticipantCount] = usePersistentState(
    'PARTICIPANT_COUNT',
    participants.length || DEFAULT_PARTICIPANTS
  );
  const [minPace, setMinPace] = usePersistentState('MIN_PACE', DEFAULT_MIN_PACE);
  const [maxPace, setMaxPace] = usePersistentState('MAX_PACE', DEFAULT_MAX_PACE);
  const [paceError, setPaceError] = useState<string | null>(null);
  const [simulationStopped, setSimulationStopped] = useState(false);
  // Lap detection UI tunables (initialize from localStorage, else from course, else defaults)
  const stored = typeof window !== 'undefined' ? localStorage.getItem('lapDetectionParams') : null;
  const parsedStored = stored ? JSON.parse(stored) : null;
  const initialLapParams =
    parsedStored ||
    (course && typeof (course as CourseWithLapDetection).getLapDetectionParams === 'function'
      ? (course as CourseWithLapDetection).getLapDetectionParams()
      : undefined);

  const [lapStepMeters, setLapStepMeters] = useState<number>(initialLapParams?.stepMeters || 1);
  const [lapBearingTolerance, setLapBearingTolerance] = useState<number>(
    initialLapParams?.bearingToleranceDeg || 90
  );
  const [lapCrossingTolerance, setLapCrossingTolerance] = useState<number>(
    initialLapParams?.crossingToleranceMeters || 1
  );

  // Apply lap detection params immediately (no debounce)
  const applyLapParamsImmediate = React.useCallback(
    (params?: {
      stepMeters?: number;
      bearingToleranceDeg?: number;
      crossingToleranceMeters?: number;
    }) => {
      const merged = {
        stepMeters: lapStepMeters,
        bearingToleranceDeg: lapBearingTolerance,
        crossingToleranceMeters: lapCrossingTolerance,
        ...(params || {}),
      };
      try {
        localStorage.setItem('lapDetectionParams', JSON.stringify(merged));
      } catch {
        // ignore storage errors
      }

      if (
        course &&
        typeof (course as CourseWithLapDetection).setLapDetectionParams === 'function'
      ) {
        (course as CourseWithLapDetection).setLapDetectionParams(merged);
      }
    },
    [course, lapStepMeters, lapBearingTolerance, lapCrossingTolerance]
  );

  // Use a ref to track if we need to update participants
  const participantsNeedUpdate = useRef(false);
  const lastElapsedTimeRef = useRef(0);

  // Use refs to track previous values to prevent infinite loops
  const prevTimeRef = useRef<number>(0);

  // Update participant count when participants array changes
  useEffect(() => {
    setParticipantCount(participants.length);
  }, [participants.length]);

  // Memoize the participant update function to avoid it changing on every render
  const updateParticipants = useCallback(
    (time: number) => {
      if (!participants.length) return false;
      // Note: We don't check simulationStopped here to avoid circular dependencies

      const lastElapsedTime = lastElapsedTimeRef.current;
      const tickDuration = Math.max(0, time - lastElapsedTime);

      // Limit the maximum time delta to prevent huge jumps if the timer gets very far ahead
      // Use a much smaller value to ensure participants don't move too quickly
      const maxTickDuration = 1; // Cap at 1 second per update for smoother simulation

      if (tickDuration === 0 && time === 0) {
        // Timer reset: reset all participants
        participants.forEach((participant) => participant.reset());
        setSimulationStopped(false); // Reset stopped state if timer is reset
        lastElapsedTimeRef.current = 0;
        return false;
      } else if (tickDuration > 0) {
        // To handle large time jumps properly, we need to move participants in smaller increments
        // rather than one big jump, to ensure proper collision detection and realistic movement

        // If the tick duration is large (e.g., greater than our max), break it into smaller steps
        const remainingTime = tickDuration;
        let timeProcessed = 0;

        // Process time in smaller increments to ensure realistic movement
        while (timeProcessed < remainingTime) {
          const stepSize = Math.min(maxTickDuration, remainingTime - timeProcessed);

          // Advance each participant by the smaller step size
          participants.forEach((participant) => participant.move(stepSize));

          // Handle collisions after each small step
          // Sort participants by ascending cumulative distance (back to front)
          const sorted = [...participants].sort(
            (a, b) => a.getCumulativeDistance() - b.getCumulativeDistance()
          );

          // Iterate from the first participant to check against the one in front
          for (let i = 0; i < sorted.length - 1; i++) {
            const behind = sorted[i];
            const front = sorted[i + 1];
            const behindDist = behind.getCumulativeDistance();
            const frontDist = front.getCumulativeDistance();

            // Check if the behind participant has caught up to or passed the front participant
            if (behindDist >= frontDist) {
              // Attempt to overtake: check course width at this distance
              const widthAtPoint = course!.getWidthAt(behindDist);
              if (widthAtPoint < behind.getWidth() + front.getWidth()) {
                // Not enough room: hold the behind participant at front distance
                behind.setCumulativeDistance(frontDist);
              }
              // If enough room, overtaking is allowed (no further action)
            }
          }

          // Increment the processed time
          timeProcessed += stepSize;
        }

        // After collision detection, resort participants by distance for consistent ordering
        participants.sort((a, b) => b.getCumulativeDistance() - a.getCumulativeDistance());
      }

      // Update our reference of the last processed time
      lastElapsedTimeRef.current = time;

      if (onParticipantUpdate) {
        onParticipantUpdate([...participants]);
      }

      // Check if all participants have finished
      const allFinished = participants.every((p) => {
        const props = p.getProperties();
        return props.finished === true;
      });

      if (allFinished && participants.length > 0) {
        setSimulationStopped(true);
      }

      return allFinished;
    },
    [participants, onParticipantUpdate, course]
  );

  // Handle elapsed time changes
  useEffect(() => {
    if (participantsNeedUpdate.current) {
      updateParticipants(elapsedTime);
      participantsNeedUpdate.current = false;
    }

    // Check if all participants have finished when elapsed time changes
    if (!simulationStopped && participants.length > 0) {
      const allFinished = participants.every((p) => {
        const props = p.getProperties();
        return props.finished === true;
      });

      if (allFinished) {
        setSimulationStopped(true);
      }
    }
  }, [elapsedTime, updateParticipants, participants, simulationStopped]);

  const handleElapsedTimeChange = useCallback(
    (time: number) => {
      // We expect time to be a whole integer from ElapsedTime
      // Skip if time hasn't changed
      if (time === prevTimeRef.current) {
        return;
      }

      // Store current time in ref
      prevTimeRef.current = time;

      // Don't advance time if simulation is stopped
      if (simulationStopped && time > elapsedTime) {
        return;
      }

      // Set our internal time state
      setElapsedTime(time);

      // Notify parent component if callback exists
      if (onElapsedTimeChange) {
        onElapsedTimeChange(time);
      }

      // Mark that participants need updating based on new time
      // The actual update will happen in the useEffect above
      participantsNeedUpdate.current = true;
    },
    [simulationStopped, elapsedTime, onElapsedTimeChange]
  );

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
    [minPace, maxPace, onPaceRangeChange]
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
    [minPace, maxPace, onPaceRangeChange]
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
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
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

      // Toggle control cards collapse/expand: 'c' toggles, 'C' forces expand
      else if (event.key === 'c') {
        window.dispatchEvent(new CustomEvent('toggle-control-cards'));
      } else if (event.key === 'C') {
        window.dispatchEvent(
          new CustomEvent('toggle-control-cards', { detail: { expanded: true } })
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [increaseParticipantCount, decreaseParticipantCount, increasePace, decreasePace]);

  const handleParticipantCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseInt(e.target.value, 10) || MIN_PARTICIPANTS;
    const count = Math.max(MIN_PARTICIPANTS, Math.min(MAX_PARTICIPANTS, rawValue));
    setParticipantCount(count);
    if (onParticipantCountChange) {
      onParticipantCountChange(count);
    }
  };

  return (
    <div className={styles.simulatorContainer}>
      <div className={styles.simulatorControls}>
        {/* Course Information */}
        <div className={styles.infoSection}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Course Length:</span>
            <span className={styles.infoValue}>
              {course ? (course.length / 1000).toFixed(2) : 0} km
              {course && course.getLapCount && course.getLapCount() > 1 ? (
                <span className={styles.infoValue} style={{ marginLeft: '8px' }}>
                  ({course.getLapCount()} laps)
                </span>
              ) : null}
            </span>
          </div>
        </div>

        {/* Lap legend when multiple laps detected */}
        {course && course.getLapCount && course.getLapCount() > 1 && (
          <div className={styles.infoItem} style={{ marginTop: '6px' }}>
            <span className={styles.infoLabel}>Lap colours:</span>
            <span className={styles.infoValue}>
              {Array.from({ length: course.getLapCount() }).map((_, i) => {
                const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#17becf'];
                const color = colors[i % colors.length];
                return (
                  <span
                    key={i}
                    style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: color,
                        display: 'inline-block',
                        marginRight: 6,
                        borderRadius: 2,
                      }}
                    />
                    Lap {i + 1}
                  </span>
                );
              })}
            </span>
          </div>
        )}

        {/* Lap detection settings moved into controls section below for better visibility */}

        {/* Control Sections */}
        <div className={styles.controlSections}>
          {/* Lap Detection Control Section */}
          {course && (
            <ControlCard title="Lap Detection">
              <div className={styles.lapSettings}>
                <div className={styles.lapControlsRow}>
                  <div className={styles.lapControl}>
                    <label className={styles.controlSmallText}>Sample step (m)</label>
                    <input
                      className={styles.lapSlider}
                      type="range"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={lapStepMeters}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLapStepMeters(val);
                        applyLapParamsImmediate({ stepMeters: val });
                      }}
                    />
                    <div className={styles.controlSmallText}>{lapStepMeters.toFixed(1)} m</div>
                  </div>

                  <div className={styles.lapControl}>
                    <label className={styles.controlSmallText}>Bearing tolerance (°)</label>
                    <input
                      className={styles.lapSlider}
                      type="range"
                      min={0}
                      max={180}
                      step={1}
                      value={lapBearingTolerance}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLapBearingTolerance(val);
                        applyLapParamsImmediate({ bearingToleranceDeg: val });
                      }}
                    />
                    <div className={styles.controlSmallText}>{lapBearingTolerance}°</div>
                  </div>

                  <div className={styles.lapControl}>
                    <label className={styles.controlSmallText}>Crossing tolerance (m)</label>
                    <input
                      className={styles.lapSlider}
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={lapCrossingTolerance}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLapCrossingTolerance(val);
                        applyLapParamsImmediate({ crossingToleranceMeters: val });
                      }}
                    />
                    <div className={styles.controlSmallText}>
                      {lapCrossingTolerance.toFixed(1)} m
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className={styles.controlSmallText} style={{ color: '#666' }}>
                    Tip: move sliders to adjust lap detection. Values are saved to your browser.
                  </div>
                  <button
                    onClick={() => applyLapParamsImmediate()}
                    className={styles.recomputeButton}
                    title="Recompute lap detection immediately with current settings"
                  >
                    Recompute now
                  </button>
                </div>
              </div>
            </ControlCard>
          )}
          {/* Participant Control Section - Simplified */}
          <ControlCard title="Participants">
            <div className={styles.controlItem}>
              <label htmlFor="participantCount" className={styles.controlLabel}>
                Count: {formatNumber(participantCount)}
              </label>
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
                  id="participantCount"
                />
              </div>
            </div>

            {/* Pace Range Controls - Simplified */}
            <div className={styles.controlItem}>
              <label className={styles.controlLabel}>Pace Range</label>
              <div className={styles.paceControlGroup}>
                <div className={styles.paceControl}>
                  <label htmlFor="minPace" className={styles.paceLabel}>
                    Min:
                  </label>
                  <input
                    id="minPace"
                    type="text"
                    pattern="[0-9]+:[0-5][0-9]"
                    value={minPace}
                    onChange={handleMinPaceChange}
                    className={styles.paceInput}
                    placeholder="MM:SS"
                    title="Slowest pace in minutes:seconds format per kilometre (e.g., 12:00)"
                    aria-label="Minimum pace in minutes and seconds per kilometre"
                  />
                  <span className={styles.paceUnit}>/km</span>
                </div>
                <div className={styles.paceControl}>
                  <label htmlFor="maxPace" className={styles.paceLabel}>
                    Max:
                  </label>
                  <input
                    id="maxPace"
                    type="text"
                    pattern="[0-9]+:[0-5][0-9]"
                    value={maxPace}
                    onChange={handleMaxPaceChange}
                    className={styles.paceInput}
                    placeholder="MM:SS"
                    title="Fastest pace in minutes:seconds format per kilometre (e.g., 2:30)"
                    aria-label="Maximum pace in minutes and seconds per kilometre"
                  />
                  <span className={styles.paceUnit}>/km</span>
                </div>
              </div>
              {paceError && <div className={styles.errorMessage}>{paceError}</div>}
              <div className={styles.paceInfo}>
                Participants will be assigned random paces between these values.
              </div>
            </div>
          </ControlCard>

          {/* Timer Control Section - Modified to use time format and simplified controls */}
          <ControlCard title="Simulation Time">
            <ElapsedTime
              onElapsedTimeChange={handleElapsedTimeChange}
              initialElapsedTime={0}
              simulationStopped={simulationStopped}
            />
          </ControlCard>
        </div>

        {/* Simplified Keyboard Shortcuts */}
        <div className={styles.keyboardShortcuts}>
          <div className={styles.shortcutsHeader}>Keyboard Shortcuts</div>
          <div className={styles.shortcutsTable}>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>[</kbd> <span>decrease participants</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>]</kbd> <span>increase participants</span>
              </div>
            </div>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>p</kbd> <span>play/pause</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>r</kbd> <span>reset</span>
              </div>
            </div>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>-</kbd> <span>decrease speed</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>+</kbd> <span>increase speed</span>
              </div>
            </div>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>q</kbd> <span>min pace slower</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>w</kbd> <span>min pace faster</span>
              </div>
            </div>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>a</kbd> <span>max pace slower</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>s</kbd> <span>max pace faster</span>
              </div>
            </div>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>c</kbd> <span>toggle controls</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>C</kbd> <span>expand all controls</span>
              </div>
            </div>
            <div className={styles.shortcutRow}>
              <div className={styles.shortcutItem}>
                <kbd>Ctrl+Z</kbd> <span>undo</span>
              </div>
              <div className={styles.shortcutItem}>
                <kbd>Ctrl+Y</kbd> <span>redo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
