import React from 'react';
import { Course } from './Course';
import * as turf from '@turf/turf';
import styles from './CoursePointsView.module.css';

interface CoursePoint {
  index: number;
  latitude: number;
  longitude: number;
  distanceFromPrevious: number;
  bearingFromPrevious: number | null;
  cumulativeDistance: number;
}

interface CoursePointsViewProps {
  course: Course | null;
}

const CoursePointsView: React.FC<CoursePointsViewProps> = ({ course }) => {
  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.noCourseMessage}>
          No course loaded. Please upload a GPX file to view course points.
        </div>
      </div>
    );
  }

  const calculateCoursePoints = (course: Course): CoursePoint[] => {
    const points = course.getPoints();
    const coursePoints: CoursePoint[] = [];

    points.forEach((point, index) => {
      const [latitude, longitude] = point;
      let distanceFromPrevious = 0;
      let bearingFromPrevious: number | null = null;

      if (index > 0) {
        const previousPoint = points[index - 1];
        const [prevLat, prevLon] = previousPoint;
        
        // Calculate distance using turf.js
        const from = turf.point([prevLon, prevLat]);
        const to = turf.point([longitude, latitude]);
        distanceFromPrevious = turf.distance(from, to, { units: 'meters' });
        
        // Calculate bearing using turf.js
        bearingFromPrevious = turf.bearing(from, to);
      }

      // Calculate cumulative distance
      const cumulativeDistance = coursePoints.reduce(
        (sum, cp) => sum + cp.distanceFromPrevious,
        0
      ) + distanceFromPrevious;

      coursePoints.push({
        index,
        latitude,
        longitude,
        distanceFromPrevious,
        bearingFromPrevious,
        cumulativeDistance,
      });
    });

    return coursePoints;
  };

  const coursePoints = calculateCoursePoints(course);

  const formatCoordinate = (value: number, precision: number = 6): string => {
    return value.toFixed(precision);
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${distance.toFixed(1)} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const formatBearing = (bearing: number | null): string => {
    if (bearing === null) return '—';
    return `${bearing.toFixed(1)}°`;
  };

  const getBearingDirection = (bearing: number | null): string => {
    if (bearing === null) return '';
    
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Course Points</h2>
        <div className={styles.summary}>
          <span className={styles.summaryItem}>
            Total Points: {coursePoints.length}
          </span>
          <span className={styles.summaryItem}>
            Total Distance: {formatDistance(coursePoints[coursePoints.length - 1]?.cumulativeDistance || 0)}
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.indexColumn}>#</th>
              <th className={styles.coordinateColumn}>Latitude</th>
              <th className={styles.coordinateColumn}>Longitude</th>
              <th className={styles.distanceColumn}>Distance from Previous</th>
              <th className={styles.bearingColumn}>Bearing from Previous</th>
              <th className={styles.distanceColumn}>Cumulative Distance</th>
            </tr>
          </thead>
          <tbody>
            {coursePoints.map((point) => (
              <tr key={point.index} className={styles.tableRow}>
                <td className={styles.indexCell}>{point.index + 1}</td>
                <td className={styles.coordinateCell}>
                  {formatCoordinate(point.latitude)}
                </td>
                <td className={styles.coordinateCell}>
                  {formatCoordinate(point.longitude)}
                </td>
                <td className={styles.distanceCell}>
                  {formatDistance(point.distanceFromPrevious)}
                </td>
                <td className={styles.bearingCell}>
                  <span className={styles.bearingValue}>
                    {formatBearing(point.bearingFromPrevious)}
                  </span>
                  {point.bearingFromPrevious !== null && (
                    <span className={styles.bearingDirection}>
                      {getBearingDirection(point.bearingFromPrevious)}
                    </span>
                  )}
                </td>
                <td className={styles.distanceCell}>
                  {formatDistance(point.cumulativeDistance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoursePointsView;
