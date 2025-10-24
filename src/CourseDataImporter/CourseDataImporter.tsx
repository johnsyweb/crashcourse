import React, { useState } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseDataImporter.module.css';
import FileUploadSection from '../FileUploadSection';
import GPXFile, { GPXData } from '../GPXFile';

interface CourseDataImporterProps {
  onCourseDataImported: (
    points: LatLngTuple[],
    metadata?: { name?: string; description?: string }
  ) => void;
}

const CourseDataImporter: React.FC<CourseDataImporterProps> = ({ onCourseDataImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

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

      onCourseDataImported(points, metadata);
    } else if (data.errorMessage) {
      setImportError(data.errorMessage);
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

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📁</div>
            <h3>Import Courses</h3>
            <p>Upload GPX files from your GPS device or mapping software</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>✏️</div>
            <h3>Edit Waypoints</h3>
            <p>Add, remove, or modify course points with precision editing tools</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>Simulate Runs</h3>
            <p>Test your course with virtual participants at different paces</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📤</div>
            <h3>Export Results</h3>
            <p>Save your edited courses back to GPX format with full metadata</p>
          </div>
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <h2>Getting Started</h2>
          <ol className={styles.stepsList}>
            <li>
              <strong>Upload a Course:</strong> Click the button below to select a GPX file from your device
            </li>
            <li>
              <strong>Review & Edit:</strong> Examine course points, edit metadata, and make adjustments
            </li>
            <li>
              <strong>Simulate:</strong> Run simulations with different participant counts and pace ranges
            </li>
            <li>
              <strong>Export:</strong> Save your modified course back to GPX format
            </li>
          </ol>
        </div>

        {/* Supported Formats */}
        <div className={styles.supportedFormats}>
          <h3>Supported File Format</h3>
          <div className={styles.formatList}>
            <div className={styles.format}>
              <span className={styles.formatIcon}>🗺️</span>
              <span><strong>GPX</strong> - GPS Exchange Format</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className={styles.uploadSection}>
        <FileUploadSection handleFileChange={handleFileChange} />
      </div>

      {importError && <div className={styles.errorMessage}>{importError}</div>}

      {file && <GPXFile file={file} onDataParsed={handleGPXDataParsed} />}
    </div>
  );
};

export default CourseDataImporter;
