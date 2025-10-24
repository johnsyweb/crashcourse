import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface SelectedPointMarkerProps {
  point: { latitude: number; longitude: number; index: number } | null;
}

// Create a custom icon for the selected point
const createSelectedPointIcon = () => {
  return L.divIcon({
    className: 'selected-point-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #ff4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
      ">
        <span>📍</span>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const SelectedPointMarker: React.FC<SelectedPointMarkerProps> = ({ point }) => {
  if (!point) {
    return null;
  }

  return (
    <Marker position={[point.latitude, point.longitude]} icon={createSelectedPointIcon()}>
      <Popup>
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
            Course Point #{point.index + 1}
          </h3>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <strong>Latitude:</strong> {point.latitude.toFixed(6)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            <strong>Longitude:</strong> {point.longitude.toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default SelectedPointMarker;
