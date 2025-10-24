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

  const {
    current: courseMetadata,
    setState: setCourseMetadata,
    clear: clearMetadataHistory,
  } = useUndoRedo<{ name?: string; description?: string }>({}, 100);

  // Enable keyboard shortcuts for undo/redo
  useUndoRedoKeyboard(undo, redo, coursePoints.length > 0);

  // Update document title based on application state
  useDocumentTitle(
    'Crash Course Simulator',
    coursePoints.length > 0
      ? courseMetadata?.name
        ? `${courseMetadata.name} - Course Simulation`
        : 'Course Simulation'
      : 'Import Course Data'
  );

  const handleCourseDataImported = (
    points: LatLngTuple[],
    metadata?: { name?: string; description?: string }
  ) => {
    setCoursePoints(points);
    if (metadata) {
      setCourseMetadata(metadata);
    }
  };

  const handleResetSimulation = () => {
    setCoursePoints([]);
    setCourseMetadata({});
    clearHistory(); // Clear undo history when resetting
    clearMetadataHistory();
  };

  const handleCoursePointsChange = (newPoints: LatLngTuple[]) => {
    setCoursePoints(newPoints);
  };

  const handleCourseMetadataChange = (newMetadata: { name?: string; description?: string }) => {
    setCourseMetadata(newMetadata);
  };

  return (
    <div className={styles.courseSimulationApp}>
      {coursePoints.length === 0 ? (
        <CourseDataImporter onCourseDataImported={handleCourseDataImported} />
      ) : (
        <CourseSimulation
          coursePoints={coursePoints}
          courseMetadata={courseMetadata}
          onReset={handleResetSimulation}
          onCoursePointsChange={handleCoursePointsChange}
          onCourseMetadataChange={handleCourseMetadataChange}
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
