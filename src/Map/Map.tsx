import React, { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';
import { FitBounds } from '../FitBounds';

interface MapProps {
  children?: ReactNode;
  gpsPoints?: LatLngTuple[];
  initialCenter?: LatLngTuple;
  initialZoom?: number;
  className?: string;
}

const Map: React.FC<MapProps> = ({
  children,
  gpsPoints,
  initialCenter = [0, 0],
  initialZoom = 2,
  className,
}) => {
  return (
    <div className={`${styles.mapWrapper} ${className || ''}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className={styles.mapContainer}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        {children}
        {gpsPoints && gpsPoints.length > 0 && (
          <FitBounds gpsPoints={gpsPoints} />
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
