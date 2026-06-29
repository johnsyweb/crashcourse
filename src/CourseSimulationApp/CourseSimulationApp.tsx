import React, { useEffect, useState, useCallback, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulationApp.module.css';
import CourseDataImporter from '../CourseDataImporter';
import CourseSimulation from '../CourseSimulation';
import { useUndoRedo, useUndoRedoKeyboard } from '../utils/useUndoRedo';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import { extractCourseDataFromUrl } from '../utils/courseSharing';
import {
  assembleCourse,
  CourseAssemblyParams,
  CourseAssemblyResult,
  defaultAssemblyParamsForSegment,
} from '../Course/assembleCourse';
import { usePersistentState } from '../utils/usePersistentState';

const CourseSimulationApp: React.FC = () => {
  const {
    current: coursePoints,
    setState: setCoursePoints,
    undo,
    redo,
    canUndo,
    canRedo,
    clear: clearHistory,
  } = useUndoRedo<LatLngTuple[]>([], 100);

  const {
    current: courseMetadata,
    setState: setCourseMetadata,
    clear: clearMetadataHistory,
  } = useUndoRedo<{ name?: string; description?: string }>({}, 100);

  const [segmentPoints, setSegmentPoints] = usePersistentState<LatLngTuple[]>('SEGMENT_POINTS', []);
  const [assemblyParams, setAssemblyParams] = usePersistentState<CourseAssemblyParams>(
    'COURSE_ASSEMBLY',
    {
      targetLengthMeters: 5000,
      mirror: false,
    }
  );

  const assemblyResult = useMemo<CourseAssemblyResult | null>(() => {
    if (segmentPoints.length < 2) {
      return null;
    }

    try {
      return assembleCourse(segmentPoints, assemblyParams);
    } catch {
      return null;
    }
  }, [segmentPoints, assemblyParams]);

  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(() => {
    return !!extractCourseDataFromUrl();
  });

  const applyAssemblyToCourse = useCallback(
    (segment: LatLngTuple[], params: CourseAssemblyParams) => {
      const result = assembleCourse(segment, params);
      setSegmentPoints(segment);
      setAssemblyParams(params);
      setCoursePoints(result.points);
      return result;
    },
    [setAssemblyParams, setCoursePoints, setSegmentPoints]
  );

  const handleCourseDataImported = useCallback(
    (
      points: LatLngTuple[],
      metadata?: { name?: string; description?: string },
      lapDetectionParams?: {
        stepMeters?: number;
        bearingToleranceDeg?: number;
        crossingToleranceMeters?: number;
      },
      importAssembly?: {
        segmentPoints: LatLngTuple[];
        assemblyParams: CourseAssemblyParams;
      }
    ) => {
      const segment = importAssembly?.segmentPoints ?? points;
      const params = importAssembly?.assemblyParams ?? defaultAssemblyParamsForSegment(segment);
      applyAssemblyToCourse(segment, params);

      if (metadata) {
        setCourseMetadata(metadata);
      }

      if (lapDetectionParams) {
        try {
          localStorage.setItem('lapDetectionParams', JSON.stringify(lapDetectionParams));
        } catch {
          // Ignore storage errors
        }
      }
    },
    [applyAssemblyToCourse, setCourseMetadata]
  );

  const handleAssemblyParamsChange = useCallback(
    (params: CourseAssemblyParams) => {
      if (segmentPoints.length < 2) {
        return;
      }
      applyAssemblyToCourse(segmentPoints, params);
    },
    [applyAssemblyToCourse, segmentPoints]
  );

  useUndoRedoKeyboard(undo, redo, coursePoints.length > 0);

  useEffect(() => {
    if (coursePoints.length === 0 && isLoadingFromUrl) {
      const sharedCourseData = extractCourseDataFromUrl();
      if (sharedCourseData) {
        const segment = sharedCourseData.segmentPoints ?? sharedCourseData.points;
        const params = sharedCourseData.courseAssembly ?? defaultAssemblyParamsForSegment(segment);
        applyAssemblyToCourse(segment, params);
        setCourseMetadata(sharedCourseData.metadata ?? {});

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

        const url = new URL(window.location.href);
        url.searchParams.delete('course');
        window.history.replaceState({}, '', url.toString());
      }
      setTimeout(() => setIsLoadingFromUrl(false), 0);
    }
  }, [isLoadingFromUrl, coursePoints.length, applyAssemblyToCourse, setCourseMetadata]);

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
    setSegmentPoints([]);
    clearHistory();
    clearMetadataHistory();
  };

  const handleCoursePointsChange = (newPoints: LatLngTuple[]) => {
    if (newPoints.length < 2) {
      setCoursePoints(newPoints);
      setSegmentPoints(newPoints);
      return;
    }

    try {
      applyAssemblyToCourse(newPoints, assemblyParams);
    } catch {
      setCoursePoints(newPoints);
      setSegmentPoints(newPoints);
    }
  };

  const handleCourseMetadataChange = (newMetadata: { name?: string; description?: string }) => {
    setCourseMetadata(newMetadata);
  };

  if (isLoadingFromUrl && coursePoints.length === 0) {
    return null;
  }

  return (
    <div className={styles.courseSimulationApp}>
      {coursePoints.length === 0 ? (
        <CourseDataImporter onCourseDataImported={handleCourseDataImported} />
      ) : (
        <CourseSimulation
          coursePoints={coursePoints}
          courseMetadata={courseMetadata}
          assemblyParams={assemblyParams}
          assemblyResult={assemblyResult}
          segmentPoints={segmentPoints}
          onAssemblyParamsChange={handleAssemblyParamsChange}
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
