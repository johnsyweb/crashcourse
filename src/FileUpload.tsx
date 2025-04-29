import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import './mapStyles.css';
import { FitBounds } from './FitBounds';
import FileUploadSection from './FileUploadSection';
import { Participant } from './Participant/Participant';
import { ParticipantDisplay } from './Participant/ParticipantDisplay';
import SimulatorDisplay from './SimulatorDisplay';
import ElapsedTime from './ElapsedTime';
import GPXFile, { GPXData } from './GPXFile';
import { Course, CourseDisplay } from './Course';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [gpsPoints, setGpsPoints] = useState<LatLngTuple[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    setError(
      gpsPoints.length < 2
        ? 'Error: At least two GPS points are required.'
        : null,
    );

    // Create a new Course instance when GPS points change
    if (gpsPoints.length >= 2) {
      try {
        const newCourse = new Course(gpsPoints);
        setCourse(newCourse);
      } catch (err) {
        console.error('Error creating course:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create course',
        );
      }
    } else {
      setCourse(null);
    }
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
          <SimulatorDisplay courseLength={course ? course.length : 0} />
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
            {course && (
              <>
                <CourseDisplay course={course} />
                {participant && (
                  <ParticipantDisplay participant={participant} />
                )}
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
