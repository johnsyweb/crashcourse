import { LatLngTuple } from 'leaflet';
import { LapDetectionParams } from '../Course/CourseWithLapDetection';

export interface ShareableCourseData {
  points: LatLngTuple[];
  metadata?: {
    name?: string;
    description?: string;
  };
  lapDetectionParams?: Partial<LapDetectionParams>;
  version: string;
}

const CURRENT_VERSION = '1.0';

/**
 * Encodes course data into a base64-encoded string for URL sharing
 */
export function encodeCourseData(data: ShareableCourseData): string {
  const dataToEncode = {
    ...data,
    version: CURRENT_VERSION,
  };

  try {
    const jsonString = JSON.stringify(dataToEncode);
    return btoa(jsonString);
  } catch (error) {
    throw new Error(
      'Failed to encode course data: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

/**
 * Decodes a base64-encoded course data string
 */
export function decodeCourseData(encoded: string): ShareableCourseData {
  const jsonString = atob(encoded);
  const data = JSON.parse(jsonString) as ShareableCourseData;

  // Validate version
  if (!data.version) {
    console.warn('Decoded data has no version, assuming v1.0');
    data.version = '1.0';
  }

  // Validate that we have points
  if (!Array.isArray(data.points) || data.points.length === 0) {
    throw new Error('Invalid course data: no points found');
  }

  return data;
}

/**
 * Creates a shareable URL with encoded course data
 */
export function createShareableUrl(data: ShareableCourseData): string {
  const encoded = encodeCourseData(data);
  const url = new URL(window.location.href);
  url.searchParams.set('course', encoded);

  return url.toString();
}

/**
 * Extracts course data from URL search parameters
 */
export function extractCourseDataFromUrl(): ShareableCourseData | null {
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get('course');

  if (!encoded) {
    return null;
  }

  try {
    return decodeCourseData(encoded);
  } catch (error) {
    console.error('Failed to decode course data from URL:', error);
    return null;
  }
}
