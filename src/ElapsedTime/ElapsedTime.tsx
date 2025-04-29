import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ElapsedTime.module.css';

interface ElapsedTimeProps {
  onElapsedTimeChange?: (elapsedTime: number) => void;
  initialElapsedTime?: number;
}

const ElapsedTime: React.FC<ElapsedTimeProps> = ({
  onElapsedTimeChange,
  initialElapsedTime = 0,
}) => {
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime);
  const [isRunning, setIsRunning] = useState(false);
  // Use a ref to avoid unnecessary callback invocations
  const lastReportedTime = useRef(initialElapsedTime);
  // Use a ref to track initialization
  const isInitialized = useRef(false);

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

  // Define resetTime with useCallback to make it stable across renders
  const resetTime = useCallback(() => {
    const resetValue = 0; // Always reset to 0 rather than initialElapsedTime
    setElapsedTime(resetValue);

    if (onElapsedTimeChange && lastReportedTime.current !== resetValue) {
      lastReportedTime.current = resetValue;
      onElapsedTimeChange(resetValue);
    }
  }, [onElapsedTimeChange]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Avoid triggering when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (key === 'p') {
        setIsRunning(true);
      } else if (key === 's') {
        setIsRunning(false);
      } else if (key === 'r') {
        resetTime();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning) {
      timer = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          // Only call the callback if the time has actually changed
          if (onElapsedTimeChange && lastReportedTime.current !== newTime) {
            lastReportedTime.current = newTime;
            onElapsedTimeChange(newTime);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, onElapsedTimeChange]);

  return (
    <div className={styles.elapsedTimeContainer}>
      <p className={styles.timeDisplay}>
        Elapsed Time: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
      </p>
      <div className={styles.buttonContainer}>
        <button
          className={`${styles.button} ${styles.startButton}`}
          onClick={() => setIsRunning(true)}
          title="Start (P)"
          aria-label="Start timer"
        >
          ▶️
        </button>
        <button
          className={`${styles.button} ${styles.stopButton}`}
          onClick={() => setIsRunning(false)}
          title="Stop (S)"
          aria-label="Stop timer"
        >
          ⏹️
        </button>
        <button
          className={`${styles.button} ${styles.resetButton}`}
          onClick={resetTime}
          title="Reset (R)"
          aria-label="Reset timer"
        >
          🔄
        </button>
      </div>
      <div className={styles.keyboardHelp}>
        Keyboard: <kbd>P</kbd> Play, <kbd>S</kbd> Stop, <kbd>R</kbd> Reset
      </div>
    </div>
  );
};

export default ElapsedTime;
