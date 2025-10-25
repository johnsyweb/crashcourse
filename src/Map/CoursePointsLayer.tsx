import React from 'react';
import { Marker, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { CoursePoint } from '../../Course/CoursePointsView';

interface CoursePointsLayerProps {
  points: CoursePoint[];
  selectedIndex?: number | null;
  showAllPoints?: boolean;
}

// Create a subtle icon for non-selected points
const createSubtlePointIcon = () => {
  return L.divIcon({
    className: 'subtle-point-marker',
    html: `
      <div style="
        width: 8px;
        height: 8px;
        background-color: #666;
        border: 1px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      ">
      </div>
    `,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
};

const CoursePointsLayer: React.FC<CoursePointsLayerProps> = ({ 
  points, 
  selectedIndex,
  showAllPoints = true 
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
