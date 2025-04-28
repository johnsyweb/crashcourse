import React, { useState, useEffect } from 'react';
import styles from './ElapsedTime.module.css';

interface ElapsedTimeProps {
  onElapsedTimeChange?: (elapsedTime: number) => void;
}

const ElapsedTime: React.FC<ElapsedTimeProps> = ({ onElapsedTimeChange }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array so this only runs once on mount

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning) {
      timer = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          if (onElapsedTimeChange) {
            onElapsedTimeChange(newTime);
          }
          return newTime;
        });
      }, 1000);
    } else if (timer) {
      clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, onElapsedTimeChange]);

  const resetTime = () => {
    setElapsedTime(0);
    if (onElapsedTimeChange) {
      onElapsedTimeChange(0);
    }
  };

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
