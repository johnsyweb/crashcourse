import React, { ReactNode, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';
import { FitBounds } from '../FitBounds';

interface MapProps {
  children?: ReactNode;
  gpsPoints?: LatLngTuple[];
  initialCenter?: LatLngTuple;
  initialZoom?: number;
  className?: string;
  centerOnPoint?: LatLngTuple;
  zoomLevel?: number;
}

const Map: React.FC<MapProps> = ({
  children,
  gpsPoints,
  initialCenter = [0, 0],
  initialZoom = 13,
  className,
  centerOnPoint,
  zoomLevel = 18,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (
      centerOnPoint &&
      mapRef.current &&
      Array.isArray(centerOnPoint) &&
      centerOnPoint.length === 2 &&
      typeof centerOnPoint[0] === 'number' &&
      typeof centerOnPoint[1] === 'number'
    ) {
      mapRef.current.setView(centerOnPoint, zoomLevel);
    }
  }, [centerOnPoint, zoomLevel]);

  return (
    <div className={`${styles.mapWrapper} ${className || ''}`}>
      <MapContainer
        center={
          centerOnPoint &&
          Array.isArray(centerOnPoint) &&
          centerOnPoint.length === 2 &&
          typeof centerOnPoint[0] === 'number' &&
          typeof centerOnPoint[1] === 'number'
            ? centerOnPoint
            : initialCenter
        }
        zoom={centerOnPoint ? zoomLevel : initialZoom}
        className={styles.mapContainer}
        scrollWheelZoom={true}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="topright" />
        {children}
        {gpsPoints && gpsPoints.length > 0 && !centerOnPoint && <FitBounds gpsPoints={gpsPoints} />}
      </MapContainer>
    </div>
  );
};

export default Map;
