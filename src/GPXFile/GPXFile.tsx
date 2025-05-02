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
      console.log('No file provided to GPXFile component');
      return;
    }

    try {
      console.log('GPXFile: Starting to parse file', file.name);
      setIsLoading(true);
      setError(null);

      // Use the generic readFileContent utility instead of the internal implementation
      const fileContent = await readFileContent(file);
      console.log('GPXFile: File content loaded successfully');

      // Create parser with safe options
      const parser = new XMLParser({
        attributeNamePrefix: '',
        ignoreAttributes: false,
        isArray: (name) => name === 'trkpt',
      });

      console.log('GPXFile: About to parse XML');
      const result = parser.parse(fileContent);
      console.log('GPXFile: XML parsed successfully', result);

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
      console.log('GPXFile: Extracted track points', trackPoints);

      // Convert to our GPXPoint format
      const points: GPXPoint[] = trackPoints.map(
        (point: { lat: string; lon: string; ele?: string; time?: string }) => ({
          lat: parseFloat(point.lat),
          lon: parseFloat(point.lon),
          ele: point.ele ? parseFloat(point.ele) : undefined,
          time: point.time || undefined,
        })
      );

      console.log('GPXFile: Converted track points to GPXPoint format', points);

      // Get track name with safe navigation
      const trackName = track.name || track.n || file.name.replace(/\.[^/.]+$/, '');
      console.log('GPXFile: Track name determined', trackName);

      const gpxData: GPXData = {
        name: trackName,
        points,
        startPoint: points.length > 0 ? points[0] : undefined,
        endPoint: points.length > 0 ? points[points.length - 1] : undefined,
        isValid: true,
      };

      console.log('GPXFile: GPX data parsed successfully', gpxData);
      onDataParsed(gpxData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse GPX file';
      console.error('GPXFile: Error while parsing GPX file', errorMessage);
      setError(errorMessage);

      onDataParsed({
        points: [],
        isValid: false,
        errorMessage,
      });
    } finally {
      setIsLoading(false);
      console.log('GPXFile: Parsing complete');
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
