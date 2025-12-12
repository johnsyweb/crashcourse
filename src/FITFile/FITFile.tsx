import React, { useState, useEffect, useCallback } from 'react';
import FitParser from 'fit-file-parser';
import styles from './FITFile.module.css';
import readFileAsArrayBuffer from './readFileAsArrayBuffer';

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
  const [pointCount, setPointCount] = useState<number | null>(null);

  const parseFIT = useCallback(async () => {
    if (!file) {
      setError('No file provided to FITFile component');
      return;
    }

    console.log('FITFile: Starting parse for file:', file.name, file.size, 'bytes');

    try {
      setIsLoading(true);
      setError(null);
      setPointCount(null);

      console.log('FITFile: Reading file as ArrayBuffer...');
      const arrayBuffer = await readFileAsArrayBuffer(file);
      console.log('FITFile: File read, ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

      const fitParser = new FitParser({
        force: true,
        speedUnit: 'm/s',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'list',
      });

      console.log('FITFile: Starting parser...');
      await new Promise<void>((resolve, reject) => {
        fitParser.parse(arrayBuffer, (error: string | null, parsedData?: FitParsedData) => {
          console.log('FITFile: Parser callback called', { error, hasData: !!parsedData });

          if (error) {
            console.error('FITFile: Parser error:', error);
            reject(new Error(error));
            return;
          }

          console.log('FITFile: Parser returned data', {
            hasData: !!parsedData,
            hasRecords: !!parsedData?.records,
            recordsCount: parsedData?.records?.length,
          });

          if (!parsedData || !parsedData.records) {
            console.error('FITFile: Invalid FIT format - missing records');
            reject(new Error('Invalid FIT format: missing records'));
            return;
          }

          console.log(
            'FITFile: Filtering position records from',
            parsedData.records.length,
            'total records'
          );

          // Show progress: update count of records being processed
          setPointCount(parsedData.records.length);

          const positionRecords = parsedData.records.filter((record: Record<string, unknown>) => {
            const hasPositionCoords =
              record.position_lat !== undefined && record.position_long !== undefined;
            const hasLatLonCoords = record.latitude !== undefined && record.longitude !== undefined;

            return hasPositionCoords || hasLatLonCoords;
          });
          console.log('FITFile: Found', positionRecords.length, 'position records');

          // Update point count with filtered results
          setPointCount(positionRecords.length);

          if (positionRecords.length === 0) {
            const totalRecords = parsedData.records.length;
            reject(
              new Error(
                `No GPS position data found in FIT file. File contains ${totalRecords} records, but none have position coordinates. This file may not contain GPS track data (e.g., indoor activities).`
              )
            );
            return;
          }

          const points: FITPoint[] = positionRecords
            .map((record): FITPoint | null => {
              let lat: number;
              let lon: number;

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

                if (
                  typeof positionLat !== 'number' ||
                  typeof positionLong !== 'number' ||
                  !isFinite(positionLat) ||
                  !isFinite(positionLong)
                ) {
                  return null;
                }

                lat = positionLat;
                lon = positionLong;
              } else {
                return null;
              }

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
                `No valid GPS coordinates found in FIT file. Found ${positionRecords.length} records with position fields, but all coordinates were invalid or out of range.`
              )
            );
            return;
          }

          const activityType = parsedData.activity?.sport;
          const activityName =
            parsedData.sessions && parsedData.sessions.length > 0
              ? parsedData.sessions[0].sport
              : undefined;
          const trackName = activityName || activityType || file.name.replace(/\.[^/.]+$/, '');
          const trackDescription = activityType ? `Activity: ${activityType}` : '';

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
      console.error('FITFile: Exception caught during parsing:', err);
      const errorMessage =
        err instanceof Error ? err.message : `Failed to parse FIT file: ${String(err)}`;
      console.error('FITFile: Setting error:', errorMessage);
      setError(errorMessage);

      onDataParsed({
        points: [],
        isValid: false,
        errorMessage,
      });
    } finally {
      console.log('FITFile: Parsing complete, setting loading to false');
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
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>
            <div>Parsing FIT file...</div>
            {pointCount !== null && (
              <div className={styles.pointCount}>
                {pointCount > 0
                  ? `Processing ${pointCount.toLocaleString()} records`
                  : 'Reading file...'}
              </div>
            )}
          </div>
        </div>
      )}
      {error && <div className={styles.errorMessage}>Error: {error}</div>}
    </div>
  );
};

export default FITFile;
