import React, { useState } from 'react';
import { Course } from './Course';
import * as turf from '@turf/turf';
import styles from './CoursePointsView.module.css';

export interface CoursePoint {
  index: number;
  latitude: number;
  longitude: number;
  distanceFromPrevious: number;
  bearingFromPrevious: number | null;
  cumulativeDistance: number;
}

interface CoursePointsViewProps {
  course: Course | null;
  onPointSelect?: (point: CoursePoint | null) => void;
  selectedPointIndex?: number | null;
  onPointsSelect?: (points: CoursePoint[]) => void;
  selectedPointIndices?: number[];
  onPointsDelete?: (pointIndices: number[]) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExportGPX?: (courseName?: string) => void;
}

const CoursePointsView: React.FC<CoursePointsViewProps> = ({
  course,
  onPointSelect,
  selectedPointIndex,
  onPointsSelect,
  selectedPointIndices,
  onPointsDelete,
  undo,
  redo,
  canUndo,
  canRedo,
  onExportGPX,
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number | null>(null);
  const [internalSelectedIndices, setInternalSelectedIndices] = useState<number[]>([]);

  // Use external selectedPointIndex if provided, otherwise use internal state
  const selectedIndex =
    selectedPointIndex !== undefined ? selectedPointIndex : internalSelectedIndex;

  // Use external selectedPointIndices if provided, otherwise use internal state
  const selectedIndices =
    selectedPointIndices !== undefined ? selectedPointIndices : internalSelectedIndices;

  // Calculate course points early so we can use them in handlers
  const calculateCoursePoints = (course: Course): CoursePoint[] => {
    const points = course.getPoints();
    const coursePoints: CoursePoint[] = [];

    points.forEach((point, index) => {
      const [latitude, longitude] = point;
      let distanceFromPrevious = 0;
      let bearingFromPrevious: number | null = null;

      if (index > 0) {
        const previousPoint = points[index - 1];
        const [prevLat, prevLon] = previousPoint;

        // Calculate distance using turf.js
        const from = turf.point([prevLon, prevLat]);
        const to = turf.point([longitude, latitude]);
        distanceFromPrevious = turf.distance(from, to, { units: 'meters' });

        // Calculate bearing using turf.js
        bearingFromPrevious = turf.bearing(from, to);
      }

      // Calculate cumulative distance
      const cumulativeDistance =
        coursePoints.reduce((sum, cp) => sum + cp.distanceFromPrevious, 0) + distanceFromPrevious;

      coursePoints.push({
        index,
        latitude,
        longitude,
        distanceFromPrevious,
        bearingFromPrevious,
        cumulativeDistance,
      });
    });

    return coursePoints;
  };

  const coursePoints = course ? calculateCoursePoints(course) : [];

  const handlePointClick = (point: CoursePoint, event: React.MouseEvent) => {
    const isCtrlKey = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd (Mac)
    const isShiftKey = event.shiftKey;

    if (isShiftKey && selectedIndices.length > 0) {
      // Range selection: select all points between last selected and current
      const lastSelected = selectedIndices[selectedIndices.length - 1];
      const start = Math.min(lastSelected, point.index);
      const end = Math.max(lastSelected, point.index);
      const rangeIndices = [];

      for (let i = start; i <= end; i++) {
        rangeIndices.push(i);
      }

      const newSelectedIndices = [...new Set([...selectedIndices, ...rangeIndices])].sort(
        (a, b) => a - b
      );

      if (selectedPointIndices === undefined) {
        setInternalSelectedIndices(newSelectedIndices);
      }

      if (onPointsSelect) {
        const selectedPoints = coursePoints.filter((cp) => newSelectedIndices.includes(cp.index));
        onPointsSelect(selectedPoints);
      }
    } else if (isCtrlKey) {
      // Toggle selection: add or remove point from selection
      const newSelectedIndices = selectedIndices.includes(point.index)
        ? selectedIndices.filter((i) => i !== point.index)
        : [...selectedIndices, point.index].sort((a, b) => a - b);

      if (selectedPointIndices === undefined) {
        setInternalSelectedIndices(newSelectedIndices);
      }

      if (onPointsSelect) {
        const selectedPoints = coursePoints.filter((cp) => newSelectedIndices.includes(cp.index));
        onPointsSelect(selectedPoints);
      }
    } else {
      // Single selection: clear multi-selection and select single point
      const newSelectedIndex = selectedIndex === point.index ? null : point.index;

      if (selectedPointIndex === undefined) {
        setInternalSelectedIndex(newSelectedIndex);
        setInternalSelectedIndices([]);
      }

      onPointSelect?.(newSelectedIndex !== null ? point : null);

      if (onPointsSelect) {
        onPointsSelect(newSelectedIndex !== null ? [point] : []);
      }
    }
  };

  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.noCourseMessage}>
          No course loaded. Please upload a GPX file to view course points.
        </div>
      </div>
    );
  }

  const formatCoordinate = (value: number, precision: number = 6): string => {
    return value.toFixed(precision);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${distance.toFixed(1)} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const formatBearing = (bearing: number | null): string => {
    if (bearing === null) return '—';
    return `${bearing.toFixed(1)}°`;
  };

  const getBearingDirection = (bearing: number | null): string => {
    if (bearing === null) return '';

    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];

    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Course Points</h2>
        <div className={styles.summary}>
          <span className={styles.summaryItem}>Total Points: {coursePoints.length}</span>
          <span className={styles.summaryItem}>
            Total Distance:{' '}
            {formatDistance(coursePoints[coursePoints.length - 1]?.cumulativeDistance || 0)}
          </span>
          {selectedIndices.length > 0 && (
            <span className={styles.summaryItem}>
              Selected: {selectedIndices.length} point{selectedIndices.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {selectedIndices.length > 0 && onPointsDelete && (
          <div className={styles.batchActions}>
            <button
              className={styles.batchDeleteButton}
              onClick={() => onPointsDelete(selectedIndices)}
              title={`Delete ${selectedIndices.length} selected point${selectedIndices.length !== 1 ? 's' : ''}`}
            >
              🗑️ Delete {selectedIndices.length} Point{selectedIndices.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
        {(undo || redo) && (
          <div className={styles.undoRedoActions}>
            <button
              className={styles.undoButton}
              onClick={undo}
              disabled={!canUndo}
              title="Undo last change (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              className={styles.redoButton}
              onClick={redo}
              disabled={!canRedo}
              title="Redo last undone change (Ctrl+Y)"
            >
              ↷ Redo
            </button>
          </div>
        )}
        {onExportGPX && (
          <div className={styles.exportActions}>
            <button
              className={styles.exportButton}
              onClick={() => onExportGPX()}
              title="Export course as GPX file"
            >
              📥 Export GPX
            </button>
          </div>
        )}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.indexColumn}>#</th>
              <th className={styles.coordinateColumn}>Latitude</th>
              <th className={styles.coordinateColumn}>Longitude</th>
              <th className={styles.distanceColumn}>Distance from Previous</th>
              <th className={styles.bearingColumn}>Bearing from Previous</th>
              <th className={styles.distanceColumn}>Cumulative Distance</th>
            </tr>
          </thead>
          <tbody>
            {coursePoints.map((point) => {
              const isSelected = selectedIndex === point.index;
              const isMultiSelected = selectedIndices.includes(point.index);
              const isAnySelected = isSelected || isMultiSelected;

              return (
                <tr
                  key={point.index}
                  className={`${styles.tableRow} ${isAnySelected ? styles.selectedRow : ''}`}
                  onClick={(e) => handlePointClick(point, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // Create a synthetic mouse event for keyboard interactions
                      const syntheticEvent = {
                        ctrlKey: false,
                        metaKey: false,
                        shiftKey: false,
                        button: 0,
                        buttons: 1,
                        clientX: 0,
                        clientY: 0,
                        screenX: 0,
                        screenY: 0,
                        pageX: 0,
                        pageY: 0,
                        movementX: 0,
                        movementY: 0,
                        relatedTarget: null,
                        target: e.target,
                        currentTarget: e.currentTarget,
                        bubbles: true,
                        cancelable: true,
                        defaultPrevented: false,
                        eventPhase: 2,
                        isTrusted: false,
                        timeStamp: Date.now(),
                        type: 'click',
                        stopPropagation: e.stopPropagation,
                        preventDefault: e.preventDefault,
                      } as unknown as React.MouseEvent;
                      handlePointClick(point, syntheticEvent);
                    }
                  }}
                  aria-selected={isAnySelected}
                >
                  <td className={styles.indexCell}>{point.index + 1}</td>
                  <td className={styles.coordinateCell}>{formatCoordinate(point.latitude)}</td>
                  <td className={styles.coordinateCell}>{formatCoordinate(point.longitude)}</td>
                  <td className={styles.distanceCell}>
                    {formatDistance(point.distanceFromPrevious)}
                  </td>
                  <td className={styles.bearingCell}>
                    <span className={styles.bearingValue}>
                      {formatBearing(point.bearingFromPrevious)}
                    </span>
                    {point.bearingFromPrevious !== null && (
                      <span className={styles.bearingDirection}>
                        {getBearingDirection(point.bearingFromPrevious)}
                      </span>
                    )}
                  </td>
                  <td className={styles.distanceCell}>
                    {formatDistance(point.cumulativeDistance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoursePointsView;
