import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import './mapStyles.css';
import { loadGpsPoints } from './utils/gpsLoader';

const FitBounds = ({ gpsPoints }: { gpsPoints: LatLngTuple[] }) => {
  const map = useMap();

  useEffect(() => {
    if (gpsPoints.length > 0) {
      const bounds: LatLngTuple[] = gpsPoints.map(([lat, lon]) => [lat, lon]);
      map.fitBounds(bounds);
    }
  }, [gpsPoints, map]);

  return null;
};

const FileUpload = () => {
  const [, setFile] = useState<File | null>(null);
  const [gpsPoints, setGpsPoints] = useState<LatLngTuple[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gpsPoints.length > 0 && gpsPoints.length < 2) {
      setError('Error: At least two GPS points are required.');
    } else {
      setError(null);
    }
  }, [gpsPoints]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange triggered');
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      console.log('File selected:', selectedFile.name);
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = async (e) => {
        console.log('File read successfully');
        const fileContent = e.target?.result as string;
        console.log('Raw file content:', fileContent);
        try {
          const points = await loadGpsPoints(fileContent);
          console.log('Parsed GPS Points:', points);
          setGpsPoints(points);
        } catch (error) {
          console.error(error);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  return (
    <div>
      <h2>Upload GPX File</h2>
      <button
        className="upload-button"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.gpx';
          input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target && target.files) {
              handleFileChange({ target } as React.ChangeEvent<HTMLInputElement>);
            }
          };
          input.click();
        }}
      >
        Select GPX File
      </button>
      <div className="map-container">
        <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />
          {gpsPoints.length > 0 && (
            <>
              <Polyline positions={gpsPoints} color="blue" />
              {gpsPoints.map((point, index) => (
                <CircleMarker
                  key={index}
                  center={point}
                  radius={5}
                  pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 1 }}
                />
              ))}
              <FitBounds gpsPoints={gpsPoints} />
            </>
          )}
        </MapContainer>
      </div>
      <div className="stats-container">
        <p>Number of GPS Points Loaded: {gpsPoints.length}</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default FileUpload;