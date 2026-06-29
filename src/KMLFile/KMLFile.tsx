import React, { useState, useEffect, useCallback } from 'react';
import styles from './KMLFile.module.css';
import { parseKMLContent } from './parseKML';
import readKMLContent from './readKMLContent';

export interface KMLPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface KMLData {
  name?: string;
  description?: string;
  points: KMLPoint[];
  startPoint?: KMLPoint;
  endPoint?: KMLPoint;
  isValid: boolean;
  errorMessage?: string;
  warning?: string;
}

interface KMLFileProps {
  file: File;
  onDataParsed: (data: KMLData) => void;
}

const KMLFile: React.FC<KMLFileProps> = ({ file, onDataParsed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState<number | null>(null);

  const parseKML = useCallback(async () => {
    if (!file) {
      setError('No file provided to KMLFile component');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setPointCount(null);

      const fileContent = await readKMLContent(file);
      const parsed = parseKMLContent(fileContent);

      setPointCount(parsed.points.length);

      const kmlData: KMLData = {
        name: parsed.name || file.name.replace(/\.(kml|kmz)$/i, ''),
        description: parsed.description,
        points: parsed.points,
        startPoint: parsed.points[0],
        endPoint: parsed.points[parsed.points.length - 1],
        isValid: true,
        warning: parsed.warning,
      };

      onDataParsed(kmlData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse KML file';
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
      parseKML();
    }
  }, [file, parseKML]);

  return (
    <div className={styles.kmlFile}>
      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>
            <div>Parsing KML file...</div>
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

export default KMLFile;
