import React, { useState } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseDataImporter.module.css';
import FileUploadSection from '../FileUploadSection';
import GPXFile, { GPXData } from '../GPXFile';
import FITFile, { FITData } from '../FITFile';

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
  };

  const handleGPXDataParsed = (data: GPXData) => {
    if (data.isValid && data.points.length > 0) {
      // Convert GPXPoint array to LatLngTuple array
      const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);

      if (points.length < 2) {
        setImportError('Course must contain at least 2 GPS points.');
        return;
      }

      // Pass metadata along with points
      const metadata = {
        name: data.name,
        description: data.description,
      };

      onCourseDataImported(points, metadata, data.lapDetectionParams);
    } else if (data.errorMessage) {
      setImportError(data.errorMessage);
    }
  };

  const handleFITDataParsed = (data: FITData) => {
    console.log('CourseDataImporter: FIT data parsed', {
      isValid: data.isValid,
      pointsCount: data.points.length,
      errorMessage: data.errorMessage,
      name: data.name,
    });

    if (data.isValid && data.points.length > 0) {
      const points: LatLngTuple[] = data.points.map((point) => [point.lat, point.lon]);

      if (points.length < 2) {
        const error = 'Course must contain at least 2 GPS points.';
        console.warn('CourseDataImporter:', error);
        setImportError(error);
        return;
      }

      console.log('CourseDataImporter: Importing course with', points.length, 'points');
      const metadata = {
        name: data.name,
        description: data.description,
      };

      onCourseDataImported(points, metadata, data.lapDetectionParams);
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

  return (
    <div className={styles.courseDataImporter}>
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
        (file.name.toLowerCase().endsWith('.fit') || file.name.toLowerCase().endsWith('.fit.gz') ? (
          <FITFile file={file} onDataParsed={handleFITDataParsed} />
        ) : (
          <GPXFile file={file} onDataParsed={handleGPXDataParsed} />
        ))}
    </div>
  );
};

export default CourseDataImporter;
