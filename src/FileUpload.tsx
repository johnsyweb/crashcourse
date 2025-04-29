import React, { useState, useEffect } from 'react';
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
import FileUploadSection from './FileUploadSection';
import { Participant } from './models/Participant';
import SimulatorDisplay from './SimulatorDisplay';
import ElapsedTime from './ElapsedTime';
import GPXFile, { GPXData } from './GPXFile';

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
  const [file, setFile] = useState<File | null>(null);
  const [gpsPoints, setGpsPoints] = useState<LatLngTuple[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    setError(
      gpsPoints.length < 2
        ? 'Error: At least two GPS points are required.'
        : null,
    );
  }, [gpsPoints]);

  useEffect(() => {
    if (gpsPoints.length > 0) {
      setParticipant(new Participant(gpsPoints));
    }
  }, [gpsPoints]);

  useEffect(() => {
    if (participant) {
      participant.updateElapsedTime(elapsedTime);
    }
  }, [elapsedTime, participant]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    console.log('File selected:', selectedFile.name);
    setFile(selectedFile);
  };

  const handleGPXDataParsed = (data: GPXData) => {
    if (data.isValid && data.points.length > 0) {
      // Convert GPXPoint array to LatLngTuple array
      const points: LatLngTuple[] = data.points.map((point) => [
        point.lat,
        point.lon,
      ]);
      setGpsPoints(points);
    } else if (data.errorMessage) {
      setError(data.errorMessage);
    }
  };

  const handleElapsedTimeChange = (newElapsedTime: number) => {
    setElapsedTime(newElapsedTime);
    if (participant) {
      participant.updateElapsedTime(newElapsedTime);
    }
  };

  const participantPosition: LatLngTuple =
    participant && participant.getPosition().length === 2
      ? (participant.getPosition() as LatLngTuple)
      : [0, 0];

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
        <>
          <FileUploadSection handleFileChange={handleFileChange} />
          {file && <GPXFile file={file} onDataParsed={handleGPXDataParsed} />}
        </>
      ) : (
        <div className="map-container">
          {error && <div className="error-message">{error}</div>}
          <SimulatorDisplay courseLength={courseLength} />
          <ElapsedTime onElapsedTimeChange={handleElapsedTimeChange} />
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
                  <Popup>
                    {participant && (
                      <div>
                        {Object.entries(participant.getProperties()).map(
                          ([key, value]) => (
                            <p key={key}>
                              <strong>{key}:</strong> {value.toString()}
                            </p>
                          ),
                        )}
                      </div>
                    )}
                  </Popup>
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
