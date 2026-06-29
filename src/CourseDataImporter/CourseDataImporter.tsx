import React, { useState } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseDataImporter.module.css';
import FileUploadSection from '../FileUploadSection';
import GPXFile, { GPXData } from '../GPXFile';
import FITFile, { FITData } from '../FITFile';
import KMLFile, { KMLData } from '../KMLFile';

export interface LapDetectionParams {
  stepMeters?: number;
  bearingToleranceDeg?: number;
  crossingToleranceMeters?: number;
}

interface CourseDataImporterProps {
  onCourseDataImported: (
    points: LatLngTuple[],
    metadata?: { name?: string; description?: string },
    lapDetectionParams?: LapDetectionParams
  ) => void;
}

const CourseDataImporter: React.FC<CourseDataImporterProps> = ({ onCourseDataImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      console.log('CourseDataImporter: No file selected');
      return;
    }

    console.log(
      'CourseDataImporter: File selected:',
      selectedFile.name,
      selectedFile.size,
      'bytes'
    );
    console.log(
      'CourseDataImporter: File type/extension:',
      selectedFile.type,
      selectedFile.name.toLowerCase()
    );

    const isFITFile =
      selectedFile.name.toLowerCase().endsWith('.fit') ||
      selectedFile.name.toLowerCase().endsWith('.fit.gz');
    console.log('CourseDataImporter: Is FIT file?', isFITFile);

    setFile(selectedFile);
    setImportError(null);
    setImportWarning(null);
    setIsProcessing(true);
  };

  const importParsedCourse = (
    points: LatLngTuple[],
    metadata?: { name?: string; description?: string },
    lapDetectionParams?: LapDetectionParams,
    warning?: string
  ) => {
    if (points.length < 2) {
      setImportError('Course must contain at least 2 GPS points.');
      return;
    }

    setImportWarning(warning ?? null);
    onCourseDataImported(points, metadata, lapDetectionParams);
  };

  const handleGPXDataParsed = (data: GPXData) => {
    setIsProcessing(false);

    if (data.isValid && data.points.length > 0) {
      const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);
      importParsedCourse(
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
  };

  const handleFITDataParsed = (data: FITData) => {
    setIsProcessing(false);

    console.log('CourseDataImporter: FIT data parsed', {
      isValid: data.isValid,
      pointsCount: data.points.length,
      errorMessage: data.errorMessage,
      name: data.name,
    });

    if (data.isValid && data.points.length > 0) {
      const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);
      importParsedCourse(
        points,
        {
          name: data.name,
          description: data.description,
        },
        data.lapDetectionParams
      );
    } else if (data.errorMessage) {
      console.error('CourseDataImporter: FIT import error:', data.errorMessage);

      const isNoGPSError = data.errorMessage.includes('No GPS position data found');
      const errorWithHelp = isNoGPSError
        ? `${data.errorMessage}\n\nFIT files with no GPS points may have been saved as an indoor activity.`
        : data.errorMessage;

      setImportError(errorWithHelp);
    } else {
      console.warn('CourseDataImporter: FIT data is invalid but no error message');
      setImportError('Failed to import FIT file: No valid data found.');
    }
  };

  const handleKMLDataParsed = (data: KMLData) => {
    setIsProcessing(false);

    if (data.isValid && data.points.length > 0) {
      const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);
      importParsedCourse(
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
  };

  const lowerFileName = file?.name.toLowerCase() ?? '';
  const isFITFile = lowerFileName.endsWith('.fit') || lowerFileName.endsWith('.fit.gz');
  const isKMLFile = lowerFileName.endsWith('.kml') || lowerFileName.endsWith('.kmz');

  return (
    <div className={styles.courseDataImporter}>
      {/* Loading Overlay */}
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

      {/* Welcome Section */}
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

        {/* Import Section - Moved up prominently */}
        <div className={styles.uploadSection}>
          <FileUploadSection handleFileChange={handleFileChange} />
        </div>

        {importError && <div className={styles.errorMessage}>{importError}</div>}
        {importWarning && <div className={styles.warningMessage}>{importWarning}</div>}

        {/* Features Grid */}
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
