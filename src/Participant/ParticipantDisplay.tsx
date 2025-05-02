import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import runnerIcon from '../assets/runner_icon.png';
import { Participant } from './Participant';

// Create a custom icon for the participant marker
const participantIcon = new L.Icon({
  iconUrl: runnerIcon,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface ParticipantDisplayProps {
  participant: Participant;
}

const ParticipantDisplay: React.FC<ParticipantDisplayProps> = ({ participant }) => {
  const position = participant.getPosition();
  const properties = participant.getProperties();

  return (
    <Marker position={position} icon={participantIcon}>
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
