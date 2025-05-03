import React, { useState } from 'react';
import { LatLngTuple } from 'leaflet';
import styles from './CourseDataImporter.module.css';
import FileUploadSection from '../FileUploadSection';
import GPXFile, { GPXData } from '../GPXFile';

interface CourseDataImporterProps {
  onCourseDataImported: (points: LatLngTuple[]) => void;
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

      onCourseDataImported(points);
    } else if (data.errorMessage) {
      setImportError(data.errorMessage);
    }
  };

  return (
    <div className={styles.courseDataImporter}>
      <h2 className={styles.title}>Import Course Data</h2>
      <p className={styles.description}>
        Upload a GPX or KML file containing GPS data for your course.
      </p>

      <FileUploadSection handleFileChange={handleFileChange} />

      {importError && <div className={styles.errorMessage}>{importError}</div>}

      {file && <GPXFile file={file} onDataParsed={handleGPXDataParsed} />}
    </div>
  );
};

export default CourseDataImporter;
