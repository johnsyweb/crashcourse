import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Course } from './Course';

// Import assets for markers
import flagIcon from '../assets/flag.svg';
import redFlagIcon from '../assets/flag-red.svg';
import greenFlagIcon from '../assets/flag-green.svg';
import checkeredFlagIcon from '../assets/checkered_flag.png';

interface CourseDisplayProps {
  course: Course;
  showKilometerMarkers?: boolean;
  lineColor?: string;
  lineWeight?: number;
}

const CourseDisplay: React.FC<CourseDisplayProps> = ({
  course,
  showKilometerMarkers = true,
  lineColor = 'blue',
  lineWeight = 3,
}) => {
  const startIcon = new L.Icon({
    iconUrl: flagIcon,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  const finishIcon = new L.Icon({
    iconUrl: checkeredFlagIcon,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  });

  const kmMarkerIcon = new L.Icon({
    iconUrl: flagIcon,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });

  const narrowIcon = L.icon({
    iconUrl: redFlagIcon,
    iconSize: [25, 25],
  });

  const wideIcon = L.icon({
    iconUrl: greenFlagIcon,
    iconSize: [25, 25],
  });

  const { narrowestPoint, narrowestWidth, widestPoint, widestWidth } = course.getCourseWidthInfo();
  // Compute right edge for visualization
  const { rightEdge } = course.getCourseEdges();

  // Create kilometre markers
  const renderKilometerMarkers = () => {
    if (!showKilometerMarkers) return null;

    const markers = [];
    const courseLength = course.length;

    // Create a marker every kilometre
    for (let km = 1; km < Math.floor(courseLength / 1000); km++) {
      const distance = km * 1000; // distance in meters
      const position = course.getPositionAtDistance(distance);

      markers.push(
        <Marker key={`km-${km}`} position={position} icon={kmMarkerIcon}>
          <Popup>{km} km</Popup>
        </Marker>
      );
    }

    return markers;
  };

  return (
    <>
      <Polyline positions={course.getPoints()} color={lineColor} weight={lineWeight} />
      {/* Right edge of the course (2m offset) */}
      <Polyline positions={rightEdge} color="gray" weight={lineWeight} dashArray="8 8" />

      {/* Start marker */}
      <Marker position={course.startPoint} icon={startIcon}>
        <Popup>Start</Popup>
      </Marker>

      {/* Kilometer markers */}
      {renderKilometerMarkers()}

      {/* Finish marker */}
      <Marker position={course.finishPoint} icon={finishIcon}>
        <Popup>Finish</Popup>
      </Marker>

      {/* Narrowest point marker */}
      <Marker position={narrowestPoint} icon={narrowIcon}>
        <Popup>Narrowest Width: {narrowestWidth.toFixed(2)}m</Popup>
      </Marker>

      {/* Widest point marker */}
      <Marker position={widestPoint} icon={wideIcon}>
        <Popup>Widest Width: {widestWidth.toFixed(2)}m</Popup>
      </Marker>
    </>
  );
};

export default CourseDisplay;
