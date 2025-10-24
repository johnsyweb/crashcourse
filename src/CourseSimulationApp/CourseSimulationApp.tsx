import React from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulationApp.module.css';
import CourseDataImporter from '../CourseDataImporter';
import CourseSimulation from '../CourseSimulation';
import { useUndoRedo, useUndoRedoKeyboard } from '../utils/useUndoRedo';
import { useDocumentTitle } from '../utils/useDocumentTitle';

// Removed empty interface and using React.FC without props type
const CourseSimulationApp: React.FC = () => {
  const {
    current: coursePoints,
    setState: setCoursePoints,
    undo,
    redo,
    canUndo,
    canRedo,
    clear: clearHistory,
  } = useUndoRedo<LatLngTuple[]>([], 100); // Keep 100 history entries

  // Enable keyboard shortcuts for undo/redo
  useUndoRedoKeyboard(undo, redo, coursePoints.length > 0);

  // Update document title based on application state
  useDocumentTitle(
    'Crash Course Simulator',
    coursePoints.length > 0 ? 'Course Simulation' : 'Import Course Data'
  );

  const handleCourseDataImported = (points: LatLngTuple[]) => {
    setCoursePoints(points);
  };

  const handleResetSimulation = () => {
    setCoursePoints([]);
    clearHistory(); // Clear undo history when resetting
  };

  const handleCoursePointsChange = (newPoints: LatLngTuple[]) => {
    setCoursePoints(newPoints);
  };

  return (
    <div className={styles.courseSimulationApp}>
      {coursePoints.length === 0 ? (
        <CourseDataImporter onCourseDataImported={handleCourseDataImported} />
      ) : (
        <CourseSimulation
          coursePoints={coursePoints}
          onReset={handleResetSimulation}
          onCoursePointsChange={handleCoursePointsChange}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}
    </div>
  );
};

export default CourseSimulationApp;
