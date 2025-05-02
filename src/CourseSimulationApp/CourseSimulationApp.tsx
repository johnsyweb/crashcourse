import React, { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulationApp.module.css';
import CourseDataImporter from '../CourseDataImporter';
import CourseSimulation from '../CourseSimulation';

// Removed empty interface and using React.FC without props type
const CourseSimulationApp: React.FC = () => {
  const [coursePoints, setCoursePoints] = useState<LatLngTuple[]>([]);

  const handleCourseDataImported = (points: LatLngTuple[]) => {
    setCoursePoints(points);
  };

  const handleResetSimulation = () => {
    setCoursePoints([]);
  };

  return (
    <div className={styles.courseSimulationApp}>
      {coursePoints.length === 0 ? (
        <CourseDataImporter onCourseDataImported={handleCourseDataImported} />
      ) : (
        <CourseSimulation coursePoints={coursePoints} onReset={handleResetSimulation} />
      )}
    </div>
  );
};

export default CourseSimulationApp;
