import React, { useState, useMemo, useCallback } from 'react';
import { Participant } from '../Participant';
import styles from './Results.module.css';

interface ResultsProps {
  participants: Participant[];
  elapsedTime: number;
  onReset?: () => void;
}

type SortField = 'position' | 'time' | 'pace' | 'targetPace' | 'delta' | 'sentiment';
type SortDirection = 'asc' | 'desc';

const Results: React.FC<ResultsProps> = ({ participants, elapsedTime, onReset }) => {
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPace = useCallback((secondsPerKm: number): string => {
    if (!isFinite(secondsPerKm) || secondsPerKm <= 0) {
      return '0:00';
    }
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const parsePaceToSeconds = useCallback((pace: string): number => {
    try {
      const [minutes, seconds] = pace.split(':').map(Number);
      if (isNaN(minutes) || isNaN(seconds)) {
        return 0;
      }
      return minutes * 60 + seconds;
    } catch (error) {
      console.error('Error parsing pace:', error);
      return 0;
    }
  }, []);

  const calculatePaceDelta = useCallback(
    (targetPace: string, actualPace: string): number => {
      return parsePaceToSeconds(actualPace) - parsePaceToSeconds(targetPace);
    },
    [parsePaceToSeconds]
  );

  const getSentiment = useCallback((delta: number): 'happy' | 'neutral' | 'sad' => {
    if (delta < -30) return 'happy';
    if (delta > 30) return 'sad';
    return 'neutral';
  }, []);

  const getSentimentEmoji = useCallback((sentiment: 'happy' | 'neutral' | 'sad'): string => {
    return {
      happy: '😊',
      neutral: '😐',
      sad: '😢',
    }[sentiment];
  }, []);

  const results = useMemo(() => {
    return participants.map((participant, index) => {
      const props = participant.getProperties();

      const id = (props.id as string) || `participant-${index}`;

      let targetPace = (props.pace as string) || '0:00';
      targetPace = targetPace.replace(/\/km$/, '');

      const cumulativeDistance = (props.cumulativeDistance as number) || 1;

      const finishTime = (props.elapsedTime as number) || elapsedTime;

      const paceInSecondsPerKm = (finishTime / cumulativeDistance) * 1000;
      const actualPace = formatPace(paceInSecondsPerKm);

      const delta = calculatePaceDelta(targetPace, actualPace);

      return {
        id,
        position: index + 1,
        time: finishTime,
        pace: actualPace,
        targetPace,
        delta,
        sentiment: getSentiment(delta),
      };
    });
  }, [participants, elapsedTime, calculatePaceDelta, formatPace, getSentiment]);

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'position':
          return (a.position - b.position) * multiplier;
        case 'time':
          return (a.time - b.time) * multiplier;
        case 'pace':
          return (parsePaceToSeconds(a.pace) - parsePaceToSeconds(b.pace)) * multiplier;
        case 'targetPace':
          return (parsePaceToSeconds(a.targetPace) - parsePaceToSeconds(b.targetPace)) * multiplier;
        case 'delta':
          return (a.delta - b.delta) * multiplier;
        case 'sentiment':
          return a.sentiment.localeCompare(b.sentiment) * multiplier;
        default:
          return 0;
      }
    });
  }, [results, sortField, sortDirection, parsePaceToSeconds]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (participants.length === 0) {
    return (
      <div className={styles.resultsContainer}>
        <h2>Results</h2>
        <p>Will be displayed here</p>
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <h2>Results</h2>
        {onReset && (
          <button onClick={onReset} className={styles.resetButton}>
            Reset Results
          </button>
        )}
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th onClick={() => handleSort('position')}>
                Position {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('time')}>
                Time {sortField === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('pace')}>
                Pace {sortField === 'pace' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('targetPace')}>
                Target Pace {sortField === 'targetPace' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('delta')}>
                Delta {sortField === 'delta' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('sentiment')}>
                Sentiment {sortField === 'sentiment' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => (
              <tr key={result.id}>
                <td>{result.position}</td>
                <td>{formatTime(result.time)}</td>
                <td>{result.pace}/km</td>
                <td>{result.targetPace}/km</td>
                <td
                  className={
                    result.delta < 0 ? styles.negative : result.delta > 0 ? styles.positive : ''
                  }
                >
                  {result.delta > 0 ? '+' : ''}
                  {result.delta}s
                </td>
                <td>{getSentimentEmoji(result.sentiment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Results;
