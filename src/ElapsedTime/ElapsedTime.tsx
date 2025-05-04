import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ElapsedTime.module.css';

interface ElapsedTimeProps {
  onElapsedTimeChange?: (elapsedTime: number) => void;
  initialElapsedTime?: number;
  simulationStopped?: boolean;
}

const ElapsedTime: React.FC<ElapsedTimeProps> = ({
  onElapsedTimeChange,
  initialElapsedTime = 0,
  simulationStopped = false,
}) => {
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime);
  const [isRunning, setIsRunning] = useState(false);
  // Add speed multiplier state with default 60x
  const [speedMultiplier, setSpeedMultiplier] = useState(60);
  // Use a ref to avoid unnecessary callback invocations
  const lastReportedTime = useRef(initialElapsedTime);
  // Use a ref to track initialization
  const isInitialized = useRef(false);

  // Define available speed options
  const speedOptions = React.useMemo(() => [1, 10, 30, 60, 120], []);

  // Initialize lastReportedTime and handle initialElapsedTime properly
  useEffect(() => {
    // Only run once to initialize
    if (!isInitialized.current) {
      lastReportedTime.current = initialElapsedTime;

      // Only call the callback during initialization if initialElapsedTime is not 0
      if (onElapsedTimeChange && initialElapsedTime !== 0) {
        onElapsedTimeChange(initialElapsedTime);
      }

      isInitialized.current = true;
    }
  }, [initialElapsedTime, onElapsedTimeChange]);

  // Stop the simulation if simulationStopped is true
  useEffect(() => {
    if (simulationStopped && isRunning) {
      setIsRunning(false);
    }
  }, [simulationStopped, isRunning]);

  // Define resetTime with useCallback to make it stable across renders
  const resetTime = useCallback(() => {
    const resetValue = 0; // Always reset to 0 rather than initialElapsedTime
    setElapsedTime(resetValue);

    if (onElapsedTimeChange && lastReportedTime.current !== resetValue) {
      lastReportedTime.current = resetValue;
      onElapsedTimeChange(resetValue);
    }
  }, [onElapsedTimeChange]);

  // Function to increase speed
  const increaseSpeed = useCallback(() => {
    setSpeedMultiplier((prevSpeed) => {
      const currentIndex = speedOptions.indexOf(prevSpeed);
      if (currentIndex < speedOptions.length - 1) {
        return speedOptions[currentIndex + 1];
      }
      return prevSpeed; // Already at max speed
    });
  }, [speedOptions]);

  // Function to decrease speed
  const decreaseSpeed = useCallback(() => {
    setSpeedMultiplier((prevSpeed) => {
      const currentIndex = speedOptions.indexOf(prevSpeed);
      if (currentIndex > 0) {
        return speedOptions[currentIndex - 1];
      }
      return prevSpeed; // Already at min speed
    });
  }, [speedOptions]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Avoid triggering when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (key === 'p') {
        if (!simulationStopped || !isRunning) {
          setIsRunning((prev) => !prev); // Toggle play/pause state
        }
      } else if (key === 'r') {
        resetTime();
      } else if (key === '+' || key === '=') {
        // Use = as alternative for + since it's the same key without shift
        increaseSpeed();
      } else if (key === '-' || key === '_') {
        // Use _ as alternative for - since it's the same key with shift
        decreaseSpeed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetTime, increaseSpeed, decreaseSpeed, simulationStopped, isRunning]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && !simulationStopped) {
      // Calculate interval based on speed multiplier (faster updates at higher speeds)
      const updateInterval = 1000 / speedMultiplier;

      timer = setInterval(() => {
        setElapsedTime((prev) => {
          // Each tick adds 1 second to the simulation time
          const newTime = prev + 1;
          // Only call the callback if the time has actually changed
          if (onElapsedTimeChange && lastReportedTime.current !== newTime) {
            lastReportedTime.current = newTime;
            onElapsedTimeChange(newTime);
          }
          return newTime;
        });
      }, updateInterval);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, onElapsedTimeChange, speedMultiplier, simulationStopped]);

  // Handle speed change
  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeedMultiplier(Number(e.target.value));
  };

  // Format time as HH:MM:SS
  const formatTimeDisplay = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  return (
    <div className={styles.elapsedTimeContainer}>
      <div className={styles.timeDisplay}>{formatTimeDisplay(elapsedTime)}</div>

      <div className={styles.controlRow}>
        <div className={styles.speedControls}>
          <label htmlFor="speedSelect" className={styles.controlLabel}>
            Speed:
          </label>
          <div className={styles.controlInputGroup}>
            <select
              id="speedSelect"
              value={speedMultiplier}
              onChange={handleSpeedChange}
              className={styles.controlSelect}
              disabled={simulationStopped}
            >
              {speedOptions.map((option) => (
                <option key={option} value={option}>
                  {option}x
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.simulationControls}>
          <button
            className={`${styles.simulationButton} ${
              isRunning ? styles.pauseButton : styles.playButton
            } ${simulationStopped && !isRunning ? styles.simulationButtonDisabled : ''}`}
            onClick={() => setIsRunning((prev) => !prev)}
            disabled={simulationStopped && !isRunning}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            title={
              simulationStopped ? 'Simulation complete' : isRunning ? 'Pause timer' : 'Start timer'
            }
          >
            {isRunning ? '⏸️' : '▶️'}
          </button>
          <button
            className={`${styles.simulationButton} ${styles.resetButton}`}
            onClick={resetTime}
            aria-label="Reset timer"
          >
            🔄
          </button>
        </div>
      </div>

      {simulationStopped && (
        <div className={styles.simulationCompleteMessage}>All participants have finished!</div>
      )}
    </div>
  );
};

export default ElapsedTime;
