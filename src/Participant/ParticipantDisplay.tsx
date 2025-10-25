import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
// Using inline SVG from Material Symbols 'directions_run' so we can colour and rotate it per-lap
import { Participant } from './Participant';

// Remove unused base icon; we'll construct divIcon with inline SVG per-participant

interface ParticipantDisplayProps {
  participant: Participant;
}

// More visually distinct lap colors
const lapColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#17becf'];

const ParticipantDisplay: React.FC<ParticipantDisplayProps> = ({ participant }) => {
  const position = participant.getPosition();

  // Validate position before rendering
  if (
    !Array.isArray(position) ||
    position.length !== 2 ||
    typeof position[0] !== 'number' ||
    typeof position[1] !== 'number' ||
    isNaN(position[0]) ||
    isNaN(position[1])
  ) {
    console.warn('Invalid participant position:', position);
    return null;
  }

  const properties = participant.getProperties();
  const lap = typeof properties.lap === 'number' ? (properties.lap as number) : 1;
  const bearing = typeof properties.bearing === 'number' ? (properties.bearing as number) : 0;
  const color = lapColors[(lap - 1) % lapColors.length];

  // Inline SVG from Material Symbols 'directions_run' (path adapted for inline use).
  // We color the path fill using the selected lap color and rotate by bearing.
  const svg = `
    <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(12 12) rotate(${bearing}) translate(-12 -12)">
        <path fill="${color}" d="M13.49 5.48c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5zM10.15 9.85l1.35 3.35L13.5 14l-1.5-2.5 1.5-3.5h1l.75 1.5 1 2.5 1 3-1 1-3 1-2-1-1-1 1-3-1.75-2.65zM18 11c.55 0 1 .45 1 1v6h-2v-4h-1v4h-2v-6c0-.55.45-1 1-1h3z"/>
      </g>
    </svg>
  `;

  const lapIcon = L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <Marker position={position} icon={lapIcon}>
      <Popup>
        <div>
          {Object.entries(properties).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {value.toString()}
            </p>
          ))}
        </div>
      </Popup>
    </Marker>
  );
};

export default ParticipantDisplay;
