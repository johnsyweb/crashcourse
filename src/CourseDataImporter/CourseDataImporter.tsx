import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseDataImporter.module.css';
import FileUploadSection from '../FileUploadSection';
import GPXFile, { GPXData } from '../GPXFile';
import FITFile, { FITData } from '../FITFile';
import KMLFile, { KMLData } from '../KMLFile';
import { CourseAssemblyControls } from '../CourseAssembly';
import {
  assembleCourse,
  CourseAssemblyParams,
  defaultAssemblyParamsForSegment,
} from '../Course/assembleCourse';

export interface LapDetectionParams {
  stepMeters?: number;
  bearingToleranceDeg?: number;
  crossingToleranceMeters?: number;
}

interface PendingImport {
  segmentPoints: LatLngTuple[];
  metadata?: { name?: string; description?: string };
  lapDetectionParams?: LapDetectionParams;
  warning?: string;
}

interface CourseDataImporterProps {
  onCourseDataImported: (
    points: LatLngTuple[],
    metadata?: { name?: string; description?: string },
    lapDetectionParams?: LapDetectionParams,
    importAssembly?: {
      segmentPoints: LatLngTuple[];
      assemblyParams: CourseAssemblyParams;
    }
  ) => void;
}

const CourseDataImporter: React.FC<CourseDataImporterProps> = ({ onCourseDataImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [assemblyParams, setAssemblyParams] = useState<CourseAssemblyParams>({
    targetLengthMeters: 5000,
    mirror: false,
  });
  const parsedFileRef = useRef<File | null>(null);

  const assemblyPreview = useMemo(() => {
    if (!pendingImport) {
      return null;
    }

    try {
      return assembleCourse(pendingImport.segmentPoints, assemblyParams);
    } catch {
      return null;
    }
  }, [assemblyParams, pendingImport]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setImportError(null);
    setPendingImport(null);
    parsedFileRef.current = null;
    setIsProcessing(true);
  };

  const queueParsedImport = useCallback(
    (
      points: LatLngTuple[],
      metadata?: { name?: string; description?: string },
      lapDetectionParams?: LapDetectionParams,
      warning?: string
    ) => {
      if (points.length < 2) {
        setImportError('Course must contain at least 2 GPS points.');
        return;
      }

      const defaults = defaultAssemblyParamsForSegment(points);
      setAssemblyParams(defaults);
      setPendingImport({
        segmentPoints: points,
        metadata,
        lapDetectionParams,
        warning,
      });
    },
    []
  );

  const handleStartAssessment = () => {
    if (!pendingImport || !assemblyPreview) {
      return;
    }

    onCourseDataImported(
      assemblyPreview.points,
      pendingImport.metadata,
      pendingImport.lapDetectionParams,
      {
        segmentPoints: pendingImport.segmentPoints,
        assemblyParams,
      }
    );
  };

  const handleGPXDataParsed = useCallback(
    (data: GPXData) => {
      if (file && parsedFileRef.current === file) {
        return;
      }
      if (file) {
        parsedFileRef.current = file;
      }

      setIsProcessing(false);

      if (data.isValid && data.points.length > 0) {
        const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);
        queueParsedImport(
          points,
          {
            name: data.name,
            description: data.description,
          },
          data.lapDetectionParams
        );
      } else if (data.errorMessage) {
        setImportError(data.errorMessage);
      }
    },
    [file, queueParsedImport]
  );

  const handleFITDataParsed = useCallback(
    (data: FITData) => {
      if (file && parsedFileRef.current === file) {
        return;
      }
      if (file) {
        parsedFileRef.current = file;
      }

      setIsProcessing(false);

      if (data.isValid && data.points.length > 0) {
        const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);
        queueParsedImport(
          points,
          {
            name: data.name,
            description: data.description,
          },
          data.lapDetectionParams
        );
      } else if (data.errorMessage) {
        const isNoGPSError = data.errorMessage.includes('No GPS position data found');
        const errorWithHelp = isNoGPSError
          ? `${data.errorMessage}\n\nFIT files with no GPS points may have been saved as an indoor activity.`
          : data.errorMessage;
        setImportError(errorWithHelp);
      } else {
        setImportError('Failed to import FIT file: No valid data found.');
      }
    },
    [file, queueParsedImport]
  );

  const handleKMLDataParsed = useCallback(
    (data: KMLData) => {
      if (file && parsedFileRef.current === file) {
        return;
      }
      if (file) {
        parsedFileRef.current = file;
      }

      setIsProcessing(false);

      if (data.isValid && data.points.length > 0) {
        const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);
        queueParsedImport(
          points,
          {
            name: data.name,
            description: data.description,
          },
          undefined,
          data.warning
        );
      } else if (data.errorMessage) {
        setImportError(data.errorMessage);
      }
    },
    [file, queueParsedImport]
  );

  const lowerFileName = file?.name.toLowerCase() ?? '';
  const isFITFile = lowerFileName.endsWith('.fit') || lowerFileName.endsWith('.fit.gz');
  const isKMLFile = lowerFileName.endsWith('.kml') || lowerFileName.endsWith('.kmz');

  return (
    <div className={styles.courseDataImporter}>
      {isProcessing && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingMessage}>
              <div className={styles.loadingTitle}>Processing course file...</div>
              <div className={styles.loadingSubtitle}>{file?.name && `Loading ${file.name}`}</div>
              <div className={styles.loadingHint}>Large files may take a moment to process</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.welcomeSection}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            <span className={styles.explosionIcon}>💥</span>
            Crash Course Simulator
          </h1>
          <p className={styles.subtitle}>
            Plan, edit, and simulate GPS courses with professional-grade tools
          </p>
        </div>

        <div className={styles.uploadSection}>
          <FileUploadSection handleFileChange={handleFileChange} />
        </div>

        {importError && <div className={styles.errorMessage}>{importError}</div>}
        {pendingImport?.warning && (
          <div className={styles.warningMessage}>{pendingImport.warning}</div>
        )}

        {pendingImport && (
          <section className={styles.assemblySection} aria-labelledby="course-assembly-heading">
            <h2 id="course-assembly-heading">Course assembly</h2>
            <p className={styles.assemblyIntro}>
              Adjust the target length and mirroring before starting your assessment.
            </p>
            <CourseAssemblyControls
              params={assemblyParams}
              assemblyResult={assemblyPreview}
              onChange={setAssemblyParams}
            />
            <button
              type="button"
              className={styles.startAssessmentButton}
              onClick={handleStartAssessment}
              disabled={!assemblyPreview}
            >
              Start assessment
            </button>
          </section>
        )}

        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>✏️</div>
            <h3>Edit Waypoints</h3>
            <p>Add, remove, or modify course points with precision editing tools</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>Simulate Participation</h3>
            <p>Test your course with virtual participants at different paces</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Analyse Congestion</h3>
            <p>Identify bottlenecks and narrow sections that cause delays</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📤</div>
            <h3>Export Results</h3>
            <p>Save your edited courses back to GPX format with full metadata</p>
          </div>
        </div>
      </div>

      {file &&
        (isFITFile ? (
          <FITFile file={file} onDataParsed={handleFITDataParsed} />
        ) : isKMLFile ? (
          <KMLFile file={file} onDataParsed={handleKMLDataParsed} />
        ) : (
          <GPXFile file={file} onDataParsed={handleGPXDataParsed} />
        ))}
    </div>
  );
};

export default CourseDataImporter;
