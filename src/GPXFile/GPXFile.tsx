import React, { useState, useEffect, useCallback } from 'react';
import { XMLParser } from 'fast-xml-parser';
import styles from './GPXFile.module.css';
import readFileContent from './readFileContent';

export interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

export interface GPXData {
  name?: string;
  description?: string;
  points: GPXPoint[];
  startPoint?: GPXPoint;
  endPoint?: GPXPoint;
  isValid: boolean;
  errorMessage?: string;
}

interface GPXFileProps {
  file: File;
  onDataParsed: (data: GPXData) => void;
}

const GPXFile: React.FC<GPXFileProps> = ({ file, onDataParsed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the parseGPX function
  const parseGPX = useCallback(async () => {
    if (!file) {
      setError('No file provided to GPXFile component');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the generic readFileContent utility instead of the internal implementation
      const fileContent = await readFileContent(file);

      // Create parser with safe options
      const parser = new XMLParser({
        attributeNamePrefix: '',
        ignoreAttributes: false,
        isArray: (name) => name === 'trkpt',
      });

      const result = parser.parse(fileContent);

      // Safe navigation of the XML structure
      if (!result?.gpx?.trk) {
        throw new Error('Invalid GPX format: missing track data');
      }

      // Handle both single track and multiple tracks
      const track = Array.isArray(result.gpx.trk) ? result.gpx.trk[0] : result.gpx.trk;

      if (!track?.trkseg?.trkpt) {
        throw new Error('Invalid GPX format: missing track points');
      }

      // Extract track points - already ensured to be an array with isArray option
      const trackPoints = track.trkseg.trkpt;

      // Convert to our GPXPoint format
      const points: GPXPoint[] = trackPoints.map(
        (point: { lat: string; lon: string; ele?: string; time?: string }) => ({
          lat: parseFloat(point.lat),
          lon: parseFloat(point.lon),
          ele: point.ele ? parseFloat(point.ele) : undefined,
          time: point.time || undefined,
        })
      );

      // Get track name and description with safe navigation
      const trackName = track.name || track.n || file.name.replace(/\.[^/.]+$/, '');
      const trackDescription = track.desc || track.description || '';

      const gpxData: GPXData = {
        name: trackName,
        description: trackDescription,
        points,
        startPoint: points.length > 0 ? points[0] : undefined,
        endPoint: points.length > 0 ? points[points.length - 1] : undefined,
        isValid: true,
      };

      onDataParsed(gpxData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse GPX file';
      setError(errorMessage);

      onDataParsed({
        points: [],
        isValid: false,
        errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, onDataParsed]);

  // Parse GPX when file changes
  useEffect(() => {
    if (file) {
      parseGPX();
    }
  }, [file, parseGPX]);

  return (
    <div className={styles.gpxFile}>
      {isLoading && <div className={styles.loadingIndicator}>Parsing GPX file...</div>}
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
};

export default GPXFile;
