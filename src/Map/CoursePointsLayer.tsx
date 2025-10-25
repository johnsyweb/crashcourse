import React from 'react';
import { CircleMarker } from 'react-leaflet';
import { CoursePoint } from '../../Course/CoursePointsView';
import { latitudeToNumber, longitudeToNumber } from '../../utils/coordinates';

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

        // Convert branded types to plain numbers for Leaflet
        const lat = latitudeToNumber(point.latitude);
        const lng = longitudeToNumber(point.longitude);

        return (
          <CircleMarker
            key={index}
            center={[lat, lng]}
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
