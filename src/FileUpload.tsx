import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import './mapStyles.css';
import calculateTrackLength from './utils/calculateTrackLength';
import L from 'leaflet';
import checkeredFlagIcon from './assets/checkered_flag.png';
import runnerIcon from './assets/runner_icon.png';
import flagIcon from './assets/flag.svg';
import { FitBounds } from './FitBounds';
import readFileContent from './utils/readFileContent';
import FileUploadSection from './FileUploadSection';
import SimulatorDisplay from './SimulatorDisplay';

const participantIcon = new L.Icon({
  iconUrl: runnerIcon,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const kmMarkerIcon = new L.Icon({
  iconUrl: flagIcon,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const FileUpload = () => {
  const [, setFile] = useState<File | null>(null);
  const [gpsPoints, setGpsPoints] = useState<LatLngTuple[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setError(
      gpsPoints.length < 2
        ? 'Error: At least two GPS points are required.'
        : null,
    );
  }, [gpsPoints]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name);
    setFile(file);
    readFileContent(file, setGpsPoints);
  };

  const startSimulation = () => {
    if (timerRef.current) return; // Prevent multiple timers

    const totalTime = 60; // Total time in seconds (1 minute)

    timerRef.current = setInterval(() => {
      setElapsedTime((prevTime) => {
        const newTime = prevTime + 1;
        if (newTime >= totalTime) {
          stopSimulation();
        }
        return newTime;
      });
    }, 1000);
  };

  const stopSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const calculateParticipantPosition = (): LatLngTuple => {
    if (gpsPoints.length === 0) return [0, 0]; // Default position if no points

    const totalDistance = calculateTrackLength(gpsPoints); // Total course length in meters
    const distanceCovered = (elapsedTime / 60) * totalDistance; // Distance in meters

    let cumulativeDistance = 0;
    for (let i = 1; i < gpsPoints.length; i++) {
      const segmentDistance = calculateSegmentDistance(
        gpsPoints[i - 1],
        gpsPoints[i],
      );

      if (cumulativeDistance + segmentDistance >= distanceCovered) {
        return interpolatePosition(
          gpsPoints[i - 1],
          gpsPoints[i],
          distanceCovered - cumulativeDistance,
          segmentDistance,
        );
      }

      cumulativeDistance += segmentDistance;
    }

    return gpsPoints[gpsPoints.length - 1]; // Finish point
  };

  const calculateSegmentDistance = (
    [lat1, lon1]: LatLngTuple,
    [lat2, lon2]: LatLngTuple,
  ): number => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadius = 6371e3; // Earth's radius in meters

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  };

  const interpolatePosition = (
    [lat1, lon1]: LatLngTuple,
    [lat2, lon2]: LatLngTuple,
    distanceCovered: number,
    segmentDistance: number,
  ): LatLngTuple => {
    const ratio = distanceCovered / segmentDistance;
    const lat = lat1 + ratio * (lat2 - lat1);
    const lon = lon1 + ratio * (lon2 - lon1);
    return [lat, lon];
  };

  const participantPosition = calculateParticipantPosition();

  const finishIcon = new L.Icon({
    iconUrl: checkeredFlagIcon,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  });

  const renderMarkers = () => {
    if (gpsPoints.length === 0) return [];

    const markers = [
      createMarker('start', gpsPoints[0], 'Start', kmMarkerIcon),
      ...createKilometerMarkers(),
      createMarker(
        'finish',
        gpsPoints[gpsPoints.length - 1],
        'Finish',
        finishIcon,
      ),
    ];

    return markers;
  };

  const createMarker = (
    key: string,
    position: LatLngTuple,
    popupText: string,
    icon?: L.Icon,
  ) => {
    if (!position || !Array.isArray(position) || position.length !== 2) {
      console.error(`Invalid position for marker ${key}:`, position);
      return null;
    }

    return (
      <Marker key={key} position={position} icon={icon}>
        <Popup>{popupText}</Popup>
      </Marker>
    );
  };

  const createKilometerMarkers = () => {
    const markers = [];
    let distance = 0;
    const earthRadius = 6371e3; // Earth's radius in meters
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    for (let i = 1; i < gpsPoints.length; i++) {
      const [lat1, lon1] = gpsPoints[i - 1];
      const [lat2, lon2] = gpsPoints[i];

      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      distance += earthRadius * c;

      if (
        Math.floor(distance / 1000) >
        Math.floor((distance - earthRadius * c) / 1000)
      ) {
        markers.push(
          createMarker(
            `km-${Math.floor(distance / 1000)}`,
            gpsPoints[i],
            `${Math.floor(distance / 1000)} km`,
            kmMarkerIcon,
          ),
        );
      }
    }

    return markers;
  };

  const courseLength =
    gpsPoints.length > 1 ? calculateTrackLength(gpsPoints) : 0;

  return (
    <div>
      {gpsPoints.length === 0 ? (
        <FileUploadSection handleFileChange={handleFileChange} />
      ) : (
        <div className="map-container">
          {error && <div className="error-message">{error}</div>}
          <SimulatorDisplay
            courseLength={courseLength}
            elapsedTime={elapsedTime}
            startSimulation={startSimulation}
            stopSimulation={stopSimulation}
          />
          <MapContainer
            center={[0, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {gpsPoints.length > 0 && (
              <>
                <Polyline positions={gpsPoints} color="blue" />
                {renderMarkers()}
                <Marker position={participantPosition} icon={participantIcon}>
                  <Popup>Participant</Popup>
                </Marker>
                <FitBounds gpsPoints={gpsPoints} />
              </>
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
