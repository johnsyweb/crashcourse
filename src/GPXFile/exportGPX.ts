import { LatLngTuple } from 'leaflet';

export interface LapDetectionParams {
  stepMeters?: number;
  bearingToleranceDeg?: number;
  crossingToleranceMeters?: number;
}

export interface GPXExportOptions {
  name?: string;
  description?: string;
  author?: string;
  includeElevation?: boolean;
  includeTimestamps?: boolean;
  lapDetectionParams?: LapDetectionParams;
}

/**
 * Converts course points to GPX format
 * @param points Array of latitude/longitude points
 * @param options Export options
 * @returns GPX XML string
 */
export function exportToGPX(points: LatLngTuple[], options: GPXExportOptions = {}): string {
  const {
    name = 'Course',
    description = 'Exported course from Crash Course Simulator',
    author = 'Crash Course Simulator',
    includeElevation = false,
    includeTimestamps = false,
    lapDetectionParams,
  } = options;

  if (points.length === 0) {
    throw new Error('Cannot export empty course');
  }

  // Generate track points
  const trackPoints = points
    .map(([lat, lon], index) => {
      let pointXml = `    <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}">`;

      if (includeElevation) {
        // Default elevation to 0 if not provided
        pointXml += `\n      <ele>0</ele>`;
      }

      if (includeTimestamps) {
        // Generate a timestamp based on index (assuming 1 second intervals)
        const timestamp = new Date(Date.now() + index * 1000).toISOString();
        pointXml += `\n      <time>${timestamp}</time>`;
      }

      pointXml += `\n    </trkpt>`;
      return pointXml;
    })
    .join('\n');

  // Generate extensions XML for lap detection parameters
  let extensionsXml = '';
  if (lapDetectionParams) {
    const lapParams = [];
    if (lapDetectionParams.stepMeters !== undefined) {
      lapParams.push(
        `<lapDetection:stepMeters>${lapDetectionParams.stepMeters}</lapDetection:stepMeters>`
      );
    }
    if (lapDetectionParams.bearingToleranceDeg !== undefined) {
      lapParams.push(
        `<lapDetection:bearingToleranceDeg>${lapDetectionParams.bearingToleranceDeg}</lapDetection:bearingToleranceDeg>`
      );
    }
    if (lapDetectionParams.crossingToleranceMeters !== undefined) {
      lapParams.push(
        `<lapDetection:crossingToleranceMeters>${lapDetectionParams.crossingToleranceMeters}</lapDetection:crossingToleranceMeters>`
      );
    }

    if (lapParams.length > 0) {
      extensionsXml = `
    <extensions>
      <lapDetection:params xmlns:lapDetection="https://www.johnsy.com/crashcourse/lapdetection">
${lapParams.map((p) => '        ' + p).join('\n')}
      </lapDetection:params>
    </extensions>`;
    }
  }

  // Generate GPX XML
  const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${author}" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <author>
      <name>${escapeXml(author)}</name>
      <link href="https://www.johnsy.com/crashcourse/">
        <text>Crash Course Simulator</text>
      </link>
    </author>
    <time>${new Date().toISOString()}</time>${extensionsXml}
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

  return gpxXml;
}

/**
 * Downloads a GPX file
 * @param points Array of latitude/longitude points
 * @param filename Name of the file to download
 * @param options Export options
 */
export function downloadGPX(
  points: LatLngTuple[],
  filename?: string,
  options: GPXExportOptions = {}
): void {
  try {
    const gpxContent = exportToGPX(points, options);

    // Use generateGPXFilename if no filename provided
    const finalFilename = filename || generateGPXFilename();

    // Create blob and download
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename.endsWith('.gpx') ? finalFilename : `${finalFilename}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download GPX file:', error);
    throw error;
  }
}

/**
 * Escapes XML special characters
 * @param text Text to escape
 * @returns Escaped text safe for XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a filename based on course name and current date
 * @param courseName Name of the course
 * @returns Generated filename
 */
export function generateGPXFilename(courseName?: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  if (courseName) {
    // Clean the course name for filename
    const cleanName = courseName
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();

    // If clean name is empty after cleaning, use default
    if (cleanName.trim() === '') {
      return `course_${dateStr}.gpx`;
    }

    return `${cleanName}_${dateStr}.gpx`;
  }

  return `course_${dateStr}.gpx`;
}
