import React, { useEffect, useRef } from 'react';
import type { CongestionPoint } from './types';
import styles from './CongestionPointsView.module.css';

interface CongestionPointsViewProps {
  congestionPoints: CongestionPoint[];
  selectedCongestionPointId?: string | null;
  onCongestionPointSelect?: (point: CongestionPoint | null) => void;
}

const CongestionPointsView: React.FC<CongestionPointsViewProps> = ({
  congestionPoints,
  selectedCongestionPointId,
  onCongestionPointSelect,
}) => {
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Scroll selected row into view
  useEffect(() => {
    if (selectedCongestionPointId) {
      const row = rowRefs.current.get(selectedCongestionPointId);
      if (row) {
        setTimeout(() => {
          row.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 100);
      }
    }
  }, [selectedCongestionPointId]);

  const formatCoordinate = (value: number, precision: number = 6): string => {
    return value.toFixed(precision);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${distance.toFixed(1)} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
  };

  // Sort by count (descending), then by distance
  const sortedPoints = [...congestionPoints].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.distance - b.distance;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Congestion Points</h2>
        <p className={styles.subtitle}>
          Points where participants were blocked from overtaking due to narrow course width
        </p>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.coordinateCell}>Latitude</th>
              <th className={styles.coordinateCell}>Longitude</th>
              <th className={styles.distanceCell}>Distance</th>
              <th className={styles.countCell}>Occurrences</th>
            </tr>
          </thead>
          <tbody>
            {sortedPoints.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  No congestion points recorded yet. Start the simulation to track congestion.
                </td>
              </tr>
            ) : (
              sortedPoints.map((point) => {
                const isSelected = selectedCongestionPointId === point.id;
                return (
                  <tr
                    key={point.id}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(point.id, el);
                      } else {
                        rowRefs.current.delete(point.id);
                      }
                    }}
                    className={isSelected ? styles.selectedRow : ''}
                    onClick={() => {
                      if (onCongestionPointSelect) {
                        onCongestionPointSelect(point);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onCongestionPointSelect) {
                          onCongestionPointSelect(point);
                        }
                      }
                    }}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                  >
                    <td className={styles.coordinateCell}>{formatCoordinate(point.latitude)}</td>
                    <td className={styles.coordinateCell}>{formatCoordinate(point.longitude)}</td>
                    <td className={styles.distanceCell}>{formatDistance(point.distance)}</td>
                    <td className={styles.countCell}>{point.count}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CongestionPointsView;
