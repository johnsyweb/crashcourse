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
          const positionRecords = parsedData.records.filter(
            (record: { position_lat?: number; position_long?: number }) =>
              record.position_lat !== undefined && record.position_long !== undefined
          );

          if (positionRecords.length === 0) {
            reject(new Error('Invalid FIT format: no position data found'));
            return;
          }

          // Convert FIT records to FITPoint format
          // FIT stores latitude/longitude in semicircles (divide by 11930464.7 to get degrees)
          const semicircleToDegrees = (semicircles: number): number => {
            return semicircles * (180 / 2147483648);
          };

          const points: FITPoint[] = positionRecords.map((record) => {
            // We've already filtered to ensure position_lat and position_long exist
            const positionLat = record.position_lat;
            const positionLong = record.position_long;
            if (positionLat === undefined || positionLong === undefined) {
              // This should never happen due to filter, but TypeScript needs this check
              throw new Error('Position data missing from record');
            }
            const lat = semicircleToDegrees(positionLat);
            const lon = semicircleToDegrees(positionLong);
            const ele = record.altitude !== undefined ? (record.altitude as number) : undefined;
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
          });

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
