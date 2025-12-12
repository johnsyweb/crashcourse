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

export interface LapDetectionParams {
  stepMeters?: number;
  bearingToleranceDeg?: number;
  crossingToleranceMeters?: number;
}

export interface GPXData {
  name?: string;
  description?: string;
  points: GPXPoint[];
  startPoint?: GPXPoint;
  endPoint?: GPXPoint;
  isValid: boolean;
  errorMessage?: string;
  lapDetectionParams?: LapDetectionParams;
}

interface GPXFileProps {
  file: File;
  onDataParsed: (data: GPXData) => void;
}

const GPXFile: React.FC<GPXFileProps> = ({ file, onDataParsed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState<number | null>(null);

  // Use useCallback to memoize the parseGPX function
  const parseGPX = useCallback(async () => {
    if (!file) {
      setError('No file provided to GPXFile component');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setPointCount(null);

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

      // Update point count for user feedback
      setPointCount(trackPoints.length);

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

      // Extract lap detection parameters from metadata extensions
      let lapDetectionParams: LapDetectionParams | undefined;
      if (result?.gpx?.metadata?.extensions?.['lapDetection:params']) {
        const params = result.gpx.metadata.extensions['lapDetection:params'];
        lapDetectionParams = {};

        if (params['lapDetection:stepMeters']) {
          lapDetectionParams.stepMeters = parseFloat(params['lapDetection:stepMeters']);
        }
        if (params['lapDetection:bearingToleranceDeg']) {
          lapDetectionParams.bearingToleranceDeg = parseFloat(
            params['lapDetection:bearingToleranceDeg']
          );
        }
        if (params['lapDetection:crossingToleranceMeters']) {
          lapDetectionParams.crossingToleranceMeters = parseFloat(
            params['lapDetection:crossingToleranceMeters']
          );
        }
      }

      const gpxData: GPXData = {
        name: trackName,
        description: trackDescription,
        points,
        startPoint: points.length > 0 ? points[0] : undefined,
        endPoint: points.length > 0 ? points[points.length - 1] : undefined,
        isValid: true,
        lapDetectionParams,
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
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>
            <div>Parsing GPX file...</div>
            {pointCount !== null && (
              <div className={styles.pointCount}>Found {pointCount.toLocaleString()} points</div>
            )}
          </div>
        </div>
      )}
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
};

export default GPXFile;
