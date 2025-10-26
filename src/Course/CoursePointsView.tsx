import React, { useState, useEffect } from 'react';
import { Course } from './Course';
import * as turf from '@turf/turf';
import styles from './CoursePointsView.module.css';
import {
  createLatitude,
  createLongitude,
  latitudeToNumber,
  longitudeToNumber,
  type Latitude,
  type Longitude,
} from '../utils/coordinates';

export interface CoursePoint {
  index: number;
  latitude: Latitude;
  longitude: Longitude;
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
  onPointAdd?: (point: [number, number], index?: number) => void;
  onBatchPointMove?: (updates: Array<{ index: number; point: [number, number] }>) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const CoursePointsView: React.FC<CoursePointsViewProps> = ({
  course,
  onPointSelect,
  selectedPointIndex,
  onPointsSelect,
  selectedPointIndices,
  onPointsDelete,
  onPointAdd,
  onBatchPointMove,
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number | null>(null);
  const [internalSelectedIndices, setInternalSelectedIndices] = useState<number[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPointLat, setNewPointLat] = useState('');
  const [newPointLng, setNewPointLng] = useState('');
  const [addAtIndex, setAddAtIndex] = useState<number>(0);

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
        latitude: createLatitude(latitude),
        longitude: createLongitude(longitude),
        distanceFromPrevious,
        bearingFromPrevious,
        cumulativeDistance,
      });
    });

    return coursePoints;
  };

  const coursePoints = course ? calculateCoursePoints(course) : [];

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

  // Utility functions for calculating point positions
  const calculateMidpoint = (
    point1: [number, number],
    point2: [number, number]
  ): [number, number] => {
    const lat = (point1[0] + point2[0]) / 2;
    const lng = (point1[1] + point2[1]) / 2;
    return [lat, lng];
  };

  const extendPoint = (
    fromPoint: [number, number],
    toPoint: [number, number],
    distanceMeters: number
  ): [number, number] => {
    const bearing = turf.bearing(
      turf.point([fromPoint[1], fromPoint[0]]),
      turf.point([toPoint[1], toPoint[0]])
    );
    const destination = turf.destination(
      turf.point([fromPoint[1], fromPoint[0]]),
      distanceMeters / 1000,
      bearing,
      { units: 'kilometers' }
    );
    return [destination.geometry.coordinates[1], destination.geometry.coordinates[0]];
  };

  const getPrepopulatedCoordinates = (insertIndex: number): [number, number] => {
    if (!course) return [0, 0];

    const points = course.getPoints();

    if (insertIndex === 0) {
      // Insert before first point - extend 10m from start towards second point
      if (points.length >= 2) {
        return extendPoint([points[0][0], points[0][1]], [points[1][0], points[1][1]], -10); // Negative distance to go backwards
      }
      return [points[0][0], points[0][1]]; // Fallback if only one point
    }

    if (insertIndex === points.length) {
      // Insert after last point - extend 10m from the last point
      if (points.length >= 2) {
        const lastPoint = [points[points.length - 1][0], points[points.length - 1][1]];
        const secondLastPoint = [points[points.length - 2][0], points[points.length - 2][1]];
        const bearing = turf.bearing(
          turf.point([secondLastPoint[1], secondLastPoint[0]]),
          turf.point([lastPoint[1], lastPoint[0]])
        );
        const destination = turf.destination(
          turf.point([lastPoint[1], lastPoint[0]]),
          0.01, // 10m in kilometers
          bearing,
          { units: 'kilometers' }
        );
        return [destination.geometry.coordinates[1], destination.geometry.coordinates[0]];
      }
      return [points[points.length - 1][0], points[points.length - 1][1]]; // Fallback if only one point
    }

    // Insert between points - use midpoint
    return calculateMidpoint(
      [points[insertIndex - 1][0], points[insertIndex - 1][1]],
      [points[insertIndex][0], points[insertIndex][1]]
    );
  };

  const handleAddPoint = () => {
    if (!onPointAdd) return;

    const lat = parseFloat(newPointLat);
    const lng = parseFloat(newPointLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    try {
      onPointAdd([lat, lng], addAtIndex);
      setShowAddForm(false);
      setNewPointLat('');
      setNewPointLng('');
      setAddAtIndex(0);
    } catch (error) {
      alert(`Error adding point: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewPointLat('');
    setNewPointLng('');
    setAddAtIndex(0);
  };

  const handleAddAfterPoint = (index: number) => {
    const insertIndex = index + 1;
    const [lat, lng] = getPrepopulatedCoordinates(insertIndex);
    setAddAtIndex(insertIndex);
    setNewPointLat(lat.toFixed(6));
    setNewPointLng(lng.toFixed(6));
    setShowAddForm(true);
  };

  const handleAddBeforeFirst = () => {
    const [lat, lng] = getPrepopulatedCoordinates(0);
    setAddAtIndex(0); // Internal logic stays 0-based
    setNewPointLat(lat.toFixed(6));
    setNewPointLng(lng.toFixed(6));
    setShowAddForm(true);
  };

  const handleAddAtEnd = () => {
    const insertIndex = coursePoints.length;
    const [lat, lng] = getPrepopulatedCoordinates(insertIndex);
    setAddAtIndex(insertIndex);
    setNewPointLat(lat.toFixed(6));
    setNewPointLng(lng.toFixed(6));
    setShowAddForm(true);
  };

  const moveSelectedPoints = (direction: 'north' | 'south' | 'east' | 'west') => {
    if (!onBatchPointMove || selectedIndices.length === 0) return;

    // Calculate new positions for all selected points
    const updates: Array<{ index: number; point: [number, number] }> = [];

    selectedIndices.forEach((index) => {
      const point = coursePoints[index];
      const currentLat = latitudeToNumber(point.latitude);
      const currentLng = longitudeToNumber(point.longitude);

      // Convert distance to degrees (rough approximation)
      const latOffset = 1 / 111000; // ~111km per degree latitude
      const lngOffset = 1 / (111000 * Math.cos((currentLat * Math.PI) / 180)); // Adjust for longitude

      let newLat = currentLat;
      let newLng = currentLng;

      switch (direction) {
        case 'north':
          newLat = currentLat + latOffset;
          break;
        case 'south':
          newLat = currentLat - latOffset;
          break;
        case 'east':
          newLng = currentLng + lngOffset;
          break;
        case 'west':
          newLng = currentLng - lngOffset;
          break;
      }

      updates.push({ index, point: [newLat, newLng] });
    });

    // Apply all updates in a single batch
    try {
      onBatchPointMove(updates);
    } catch (error) {
      alert(`Error moving points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addAfterSelectedPoint = () => {
    if (!onPointAdd || selectedIndices.length === 0) return;

    // Use the first selected point for adding after
    const index = selectedIndices[0];
    handleAddAfterPoint(index);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (selectedIndices.length === 0) return;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          e.preventDefault();
          moveSelectedPoints('north');
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          moveSelectedPoints('south');
          break;
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          moveSelectedPoints('west');
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          moveSelectedPoints('east');
          break;
        case 'enter':
        case '+':
          e.preventDefault();
          addAfterSelectedPoint();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndices, onBatchPointMove, onPointAdd]);

  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.noCourseMessage}>
          No course loaded. Please upload a GPX file to view course points.
        </div>
      </div>
    );
  }

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

        {onPointAdd && !showAddForm && (
          <div className={styles.addPointButtons}>
            <button
              className={styles.addPointButton}
              onClick={handleAddBeforeFirst}
              title="Add a point at the start of the course (becomes new first point)"
            >
              + Add at Start
            </button>
            <button
              className={styles.addPointButton}
              onClick={handleAddAtEnd}
              title="Add a point at the end of the course"
            >
              + Add at End
            </button>
          </div>
        )}
        {onPointAdd && showAddForm && (
          <div className={styles.addPointForm}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                Latitude:
                <input
                  type="number"
                  step="any"
                  value={newPointLat}
                  onChange={(e) => setNewPointLat(e.target.value)}
                  placeholder="e.g., 51.505"
                  className={styles.formInput}
                />
              </label>
              <label className={styles.formLabel}>
                Longitude:
                <input
                  type="number"
                  step="any"
                  value={newPointLng}
                  onChange={(e) => setNewPointLng(e.target.value)}
                  placeholder="e.g., -0.127"
                  className={styles.formInput}
                />
              </label>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.addButton}
                onClick={handleAddPoint}
                disabled={!newPointLat || !newPointLng}
              >
                Add Point
              </button>
              <button className={styles.cancelButton} onClick={handleCancelAdd}>
                Cancel
              </button>
            </div>
          </div>
        )}
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
      </div>

      {/* Selected Points Controls */}
      {selectedIndices.length > 0 && (
        <div className={styles.selectedControls}>
          <div className={styles.controlButtons}>
            {(onBatchPointMove || onPointAdd) && (
              <div className={styles.directionalControls}>
                {onBatchPointMove && (
                  <>
                    <button
                      className={styles.directionButton}
                      onClick={() => moveSelectedPoints('north')}
                      title="Move selected points 1m north (↑ or W)"
                    >
                      ↑
                    </button>
                    <div className={styles.directionRow}>
                      <button
                        className={styles.directionButton}
                        onClick={() => moveSelectedPoints('west')}
                        title="Move selected points 1m west (← or A)"
                      >
                        ←
                      </button>
                      <button
                        className={styles.directionButton}
                        onClick={() => moveSelectedPoints('east')}
                        title="Move selected points 1m east (→ or D)"
                      >
                        →
                      </button>
                    </div>
                    <button
                      className={styles.directionButton}
                      onClick={() => moveSelectedPoints('south')}
                      title="Move selected points 1m south (↓ or S)"
                    >
                      ↓
                    </button>
                  </>
                )}
              </div>
            )}
            {onPointAdd && (
              <button
                className={styles.addAfterButton}
                onClick={addAfterSelectedPoint}
                title="Add point after selected point (Enter or +)"
              >
                + Add After
              </button>
            )}
          </div>
        </div>
      )}

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
