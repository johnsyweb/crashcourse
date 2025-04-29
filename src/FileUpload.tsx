import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import './mapStyles.css';
import FileUploadSection from './FileUploadSection';
import { Participant } from './Participant/Participant';
import ParticipantDisplay from './Participant/ParticipantDisplay';
import GPXFile, { GPXData } from './GPXFile';
import { Course, CourseDisplay } from './Course';
import Map from './Map';
import Simulator from './Simulator';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [gpsPoints, setGpsPoints] = useState<LatLngTuple[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
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
      // Initialize a participant with the default pace
      const newParticipant = new Participant(gpsPoints);
      setParticipants([newParticipant]);
    }
  }, [gpsPoints]);

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

  const handleParticipantUpdate = (updatedParticipants: Participant[]) => {
    setParticipants([...updatedParticipants]);
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

          <Simulator
            course={course}
            participants={participants}
            onParticipantUpdate={handleParticipantUpdate}
          />

          <Map gpsPoints={gpsPoints}>
            {course && (
              <>
                <CourseDisplay course={course} />
                {participants.map((participant, index) => (
                  <ParticipantDisplay key={index} participant={participant} />
                ))}
              </>
            )}
          </Map>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
