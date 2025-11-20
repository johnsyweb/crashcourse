import React, { useEffect, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulationApp.module.css';
import CourseDataImporter from '../CourseDataImporter';
import CourseSimulation from '../CourseSimulation';
import { useUndoRedo, useUndoRedoKeyboard } from '../utils/useUndoRedo';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import { extractCourseDataFromUrl } from '../utils/courseSharing';

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

  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(() => {
    // Check if URL has course data synchronously on mount
    return !!extractCourseDataFromUrl();
  });

  const handleCourseDataImported = useCallback(
    (
      points: LatLngTuple[],
      metadata?: { name?: string; description?: string },
      lapDetectionParams?: {
        stepMeters?: number;
        bearingToleranceDeg?: number;
        crossingToleranceMeters?: number;
      }
    ) => {
      setCoursePoints(points);
      if (metadata) {
        setCourseMetadata(metadata);
      }

      // Store lap detection params in localStorage
      if (lapDetectionParams) {
        try {
          localStorage.setItem('lapDetectionParams', JSON.stringify(lapDetectionParams));
        } catch {
          // Ignore storage errors
        }
      }
    },
    [setCoursePoints, setCourseMetadata]
  );

  // Enable keyboard shortcuts for undo/redo
  useUndoRedoKeyboard(undo, redo, coursePoints.length > 0);

  // Auto-load course data from URL if present
  useEffect(() => {
    if (coursePoints.length === 0 && isLoadingFromUrl) {
      const sharedCourseData = extractCourseDataFromUrl();
      if (sharedCourseData) {
        handleCourseDataImported(sharedCourseData.points, sharedCourseData.metadata);

        // Store lap detection params if included
        if (sharedCourseData.lapDetectionParams) {
          try {
            localStorage.setItem(
              'lapDetectionParams',
              JSON.stringify(sharedCourseData.lapDetectionParams)
            );
          } catch {
            // Ignore storage errors
          }
        }

        // Clear the URL parameter after loading
        const url = new URL(window.location.href);
        url.searchParams.delete('course');
        window.history.replaceState({}, '', url.toString());
      }
      // Schedule state update for next tick to avoid calling setState in effect
      setTimeout(() => setIsLoadingFromUrl(false), 0);
    }
  }, [isLoadingFromUrl, coursePoints.length, handleCourseDataImported]);

  // Update document title based on application state
  useDocumentTitle(
    'Crash Course Simulator',
    coursePoints.length > 0
      ? courseMetadata?.name
        ? `${courseMetadata.name} - Course Simulation`
        : 'Course Simulation'
      : 'Import Course Data'
  );

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

  // Don't show import screen while loading course data from URL
  if (isLoadingFromUrl && coursePoints.length === 0) {
    return null; // or a loading spinner
  }

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
