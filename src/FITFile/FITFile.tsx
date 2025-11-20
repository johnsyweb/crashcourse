import React, { useState, useEffect, useCallback } from 'react';
import FitParser from 'fit-file-parser';
import styles from './FITFile.module.css';
import readFileAsArrayBuffer from './readFileAsArrayBuffer';

// Type for parsed FIT data based on fit-file-parser library
interface FitParsedData {
  records?: Array<{
    position_lat?: number;
    position_long?: number;
    altitude?: number;
    timestamp?: Date | string | number;
    [key: string]: unknown;
  }>;
  activity?: { sport?: string; [key: string]: unknown };
  sessions?: Array<{ sport?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface FITPoint {
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

export interface FITData {
  name?: string;
  description?: string;
  points: FITPoint[];
  startPoint?: FITPoint;
  endPoint?: FITPoint;
  isValid: boolean;
  errorMessage?: string;
  lapDetectionParams?: LapDetectionParams;
}

interface FITFileProps {
  file: File;
  onDataParsed: (data: FITData) => void;
}

const FITFile: React.FC<FITFileProps> = ({ file, onDataParsed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFIT = useCallback(async () => {
    if (!file) {
      setError('No file provided to FITFile component');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const arrayBuffer = await readFileAsArrayBuffer(file);

      // Create parser with mode 'list' to get flat records array
      // fit-file-parser with mode: 'list' already converts semicircles to degrees
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'm/s',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'list',
      });

      // fit-file-parser uses a callback-based API
      await new Promise<void>((resolve, reject) => {
        fitParser.parse(arrayBuffer, (error: string | null, parsedData?: FitParsedData) => {
          if (error) {
            reject(new Error(error));
            return;
          }

          if (!parsedData || !parsedData.records) {
            reject(new Error('Invalid FIT format: missing records'));
            return;
          }

          // Extract position records - records with lat/lon
          // fit-file-parser with mode: 'list' converts semicircles to degrees in position_lat/long
          const positionRecords = parsedData.records.filter((record: Record<string, unknown>) => {
            const hasPositionCoords =
              record.position_lat !== undefined && record.position_long !== undefined;
            const hasLatLonCoords = record.latitude !== undefined && record.longitude !== undefined;

            return hasPositionCoords || hasLatLonCoords;
          });

          if (positionRecords.length === 0) {
            reject(new Error('Invalid FIT format: no position data found'));
            return;
          }

          // Convert FIT records to FITPoint format
          // fit-file-parser with mode: 'list' already converts semicircles to degrees
          // So position_lat and position_long are already in degrees, not semicircles
          const points: FITPoint[] = positionRecords
            .map((record): FITPoint | null => {
              let lat: number;
              let lon: number;

              // fit-file-parser with mode: 'list' already converts semicircles to degrees
              // Check if we have latitude/longitude fields first (explicitly converted)
              if (
                record.latitude !== undefined &&
                typeof record.latitude === 'number' &&
                record.longitude !== undefined &&
                typeof record.longitude === 'number'
              ) {
                lat = record.latitude;
                lon = record.longitude;
              } else if (record.position_lat !== undefined && record.position_long !== undefined) {
                const positionLat = record.position_lat as number;
                const positionLong = record.position_long as number;

                // Validate values are numbers
                if (
                  typeof positionLat !== 'number' ||
                  typeof positionLong !== 'number' ||
                  !isFinite(positionLat) ||
                  !isFinite(positionLong)
                ) {
                  return null;
                }

                // fit-file-parser with mode: 'list' already converts semicircles to degrees
                // So position_lat/long are already in degrees
                lat = positionLat;
                lon = positionLong;
              } else {
                return null;
              }

              // Validate coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
              if (
                !isFinite(lat) ||
                !isFinite(lon) ||
                lat < -90 ||
                lat > 90 ||
                lon < -180 ||
                lon > 180
              ) {
                return null;
              }

              const ele =
                record.altitude !== undefined
                  ? (record.altitude as number)
                  : record.elevation !== undefined
                    ? (record.elevation as number)
                    : undefined;
              const time =
                record.timestamp !== undefined
                  ? new Date(record.timestamp as Date | string | number).toISOString()
                  : undefined;

              return {
                lat,
                lon,
                ele,
                time,
              };
            })
            .filter((point): point is FITPoint => point !== null);

          if (points.length === 0) {
            reject(
              new Error(
                'No valid position data found in FIT file after filtering invalid coordinates'
              )
            );
            return;
          }

          // Extract name from activity or file name
          const activityType = parsedData.activity?.sport;
          const activityName =
            parsedData.sessions && parsedData.sessions.length > 0
              ? parsedData.sessions[0].sport
              : undefined;
          const trackName = activityName || activityType || file.name.replace(/\.[^/.]+$/, '');
          const trackDescription = activityType ? `Activity: ${activityType}` : '';

          // Extract lap detection parameters (FIT files don't have custom extensions, so we use defaults)
          const lapDetectionParams: LapDetectionParams | undefined = undefined;

          const fitData: FITData = {
            name: trackName,
            description: trackDescription,
            points,
            startPoint: points.length > 0 ? points[0] : undefined,
            endPoint: points.length > 0 ? points[points.length - 1] : undefined,
            isValid: true,
            lapDetectionParams,
          };

          onDataParsed(fitData);
          resolve();
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse FIT file';
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

  useEffect(() => {
    if (file) {
      parseFIT();
    }
  }, [file, parseFIT]);

  return (
    <div className={styles.fitFile}>
      {isLoading && <div className={styles.loadingIndicator}>Parsing FIT file...</div>}
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
};

export default FITFile;
