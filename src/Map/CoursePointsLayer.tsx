import React from 'react';
import { CircleMarker } from 'react-leaflet';
import { CoursePoint } from '../../Course/CoursePointsView';

interface CoursePointsLayerProps {
  points: CoursePoint[];
  selectedIndex?: number | null;
  showAllPoints?: boolean;
}

const CoursePointsLayer: React.FC<CoursePointsLayerProps> = ({
  points,
  selectedIndex,
  showAllPoints = true,
}) => {
  if (!showAllPoints) {
    return null;
  }

  return (
    <>
      {points.map((point, index) => {
        // Skip the selected point as it's handled by SelectedPointMarker
        if (index === selectedIndex) {
          return null;
        }

        // Validate coordinates before rendering
        if (
          typeof point.latitude !== 'number' ||
          typeof point.longitude !== 'number' ||
          isNaN(point.latitude) ||
          isNaN(point.longitude) ||
          point.latitude < -90 ||
          point.latitude > 90 ||
          point.longitude < -180 ||
          point.longitude > 180
        ) {
          console.warn('Invalid course point coordinates:', point);
          return null;
        }

        return (
          <CircleMarker
            key={index}
            center={[point.latitude, point.longitude]}
            radius={3}
            pathOptions={{
              color: '#666',
              fillColor: '#666',
              fillOpacity: 0.6,
              weight: 1,
            }}
          />
        );
      })}
    </>
  );
};

export default CoursePointsLayer;
