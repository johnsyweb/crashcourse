import React from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import styles from './CourseSimulationApp.module.css';
import CourseDataImporter from '../CourseDataImporter';
import CourseSimulation from '../CourseSimulation';
import { usePersistentState } from '../utils/usePersistentState';
import { useDocumentTitle } from '../utils/useDocumentTitle';

// Removed empty interface and using React.FC without props type
const CourseSimulationApp: React.FC = () => {
  const [coursePoints, setCoursePoints] = usePersistentState('COURSE_POINTS', [] as LatLngTuple[]);

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
  };

  return (
    <div className={styles.courseSimulationApp}>
      {coursePoints.length === 0 ? (
        <CourseDataImporter onCourseDataImported={handleCourseDataImported} />
      ) : (
        <CourseSimulation
          coursePoints={coursePoints}
          onReset={handleResetSimulation}
          onCoursePointsChange={setCoursePoints}
        />
      )}
    </div>
  );
};

export default CourseSimulationApp;
