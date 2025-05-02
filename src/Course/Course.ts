import { LatLngTuple } from 'leaflet';
import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';

/**
 * Represents a course for an event, defined by a series of GPS points.
 */
export class Course {
  // Width-related constants
  private static readonly DEFAULT_WIDTH = 2; // metres
  private static readonly MAX_WIDTH = Course.DEFAULT_WIDTH * 2; // metres
  private static readonly MAX_WIDTH_PLUS_TOLERANCE = Course.MAX_WIDTH * 1.01; // Add 1% for floating point precision

  private points: LatLngTuple[];
  private cumulativeDistances: number[] = [];
  private totalLength: number;
  private lineString: Feature<LineString>;

  /**
   * Creates a new Course instance from an array of GPS points.
   * @param points - Array of latitude/longitude points defining the course
   */
  constructor(points: LatLngTuple[]) {
    if (points.length < 2) {
      throw new Error('Course must have at least two points');
    }
    this.points = points;
    this.lineString = turf.lineString(points.map(([lat, lon]) => [lon, lat]));
    this.totalLength = turf.length(this.lineString, { units: 'meters' });
    this.calculateDistances();
  }

  /**
   * Get the total length of the course in meters
   */
  get length(): number {
    return this.totalLength;
  }

  /**
   * Get the starting point of the course
   */
  get startPoint(): LatLngTuple {
    return this.points[0];
  }

  /**
   * Get the finish point of the course
   */
  get finishPoint(): LatLngTuple {
    return this.points[this.points.length - 1];
  }

  /**
   * Gets all points in the course.
   */
  getPoints(): LatLngTuple[] {
    return [...this.points]; // Return a copy to prevent external modifications
  }

  /**
   * Get the position at a specific distance along the course
   * @param distance Distance in meters from the start
   * @returns [lat, lon] tuple
   */
  getPositionAtDistance(distance: number): LatLngTuple {
    if (distance < 0 || distance > this.totalLength) {
      throw new Error('Distance is out of bounds');
    }

    // Use turf.along to find the point at the specified distance
    const point = turf.along(this.lineString, distance / 1000, { units: 'kilometers' });
    const [lon, lat] = point.geometry.coordinates;
    return [lat, lon];
  }

  /**
   * Calculates the distance for a given position along the course.
   * @param position - Latitude and longitude coordinates
   * @returns The approximate distance in meters from the start to the closest point on the course
   */
  getDistanceAtPosition(position: LatLngTuple): number {
    const [targetLat, targetLon] = position;
    let minDistance = Infinity;
    let closestSegmentDistance = 0;

    // Find the closest point on any segment of the course
    for (let i = 0; i < this.points.length - 1; i++) {
      const [lat1, lon1] = this.points[i];
      const [lat2, lon2] = this.points[i + 1];

      // Create a line string for this segment
      const segment = turf.lineString([
        [lon1, lat1],
        [lon2, lat2],
      ]);

      // Find the nearest point on this segment
      const nearestPoint = turf.nearestPointOnLine(segment, [targetLon, targetLat]);
      const distToClosest = nearestPoint.properties.dist;

      if (distToClosest < minDistance) {
        minDistance = distToClosest;

        // Calculate distance along the course to this point
        const distAlongSegment = turf.distance([lon1, lat1], nearestPoint.geometry.coordinates, {
          units: 'meters',
        });
        closestSegmentDistance = this.cumulativeDistances[i] + distAlongSegment;
      }
    }

    return closestSegmentDistance;
  }

  private normalizeBearing(bearing: number): number {
    return ((bearing % 360) + 360) % 360;
  }

  private isOppositeBearing(bearing1: number, bearing2: number): boolean {
    const bearingDiff = Math.abs(bearing1 - bearing2);
    const normalizedDiff = bearingDiff > 180 ? 360 - bearingDiff : bearingDiff;
    return Math.abs(normalizedDiff - 180) <= 20;
  }

  private findClosestParallelPath(position: LatLngTuple, bearing: number): number | null {
    const [lat, lon] = position;
    const point = turf.point([lon, lat]);
    const normalizedBearing = this.normalizeBearing(bearing);

    // Get the current segment we're on
    const currentDistance = this.getDistanceAtPosition(position);
    let currentSegmentIndex = 0;
    for (let i = 0; i < this.cumulativeDistances.length - 1; i++) {
      if (
        currentDistance >= this.cumulativeDistances[i] &&
        currentDistance < this.cumulativeDistances[i + 1]
      ) {
        currentSegmentIndex = i;
        break;
      }
    }

    // Look for segments with opposite bearings
    const segments = this.points
      .slice(0, -1)
      .map((startPoint, i) => {
        // Skip the current segment
        if (i === currentSegmentIndex) return null;

        const [lat1, lon1] = startPoint;
        const [lat2, lon2] = this.points[i + 1];

        // Calculate the bearing of this segment and normalize it
        const segmentBearing = this.normalizeBearing(turf.bearing([lon1, lat1], [lon2, lat2]));

        // Only consider segments that have an opposite bearing
        if (this.isOppositeBearing(segmentBearing, normalizedBearing)) {
          // Create a line string for this segment
          const segment = turf.lineString([
            [lon1, lat1],
            [lon2, lat2],
          ]);

          // Find nearest point on the segment
          const nearestPoint = turf.nearestPointOnLine(segment, point);

          // Calculate the distance using turf.js
          const distance = turf.distance(point, nearestPoint, { units: 'meters' });

          // Only consider segments within MAX_WIDTH_PLUS_TOLERANCE
          if (distance <= Course.MAX_WIDTH_PLUS_TOLERANCE) {
            return { index: i, distance, segment };
          }
        }

        return null;
      })
      .filter(
        (s): s is { index: number; distance: number; segment: Feature<LineString> } => s !== null
      );

    if (segments.length === 0) return null;

    // Select the closest one
    const closestSegment = segments.reduce((min, current) =>
      current.distance < min.distance ? current : min
    );

    // Round the distance to the nearest meter
    return Math.round(closestSegment.distance);
  }

  /**
   * Gets the width of the course at a specific distance
   * @param distance Distance in meters from the start
   * @returns Width in meters
   */
  public getWidthAt(distance: number): number {
    if (distance < 0 || distance > this.totalLength) {
      throw new Error('Distance is out of bounds');
    }

    // Get the position and bearing at this distance
    const position = this.getPositionAtDistance(distance);
    const bearing = this.getBearingAtDistance(distance);

    // Find the closest parallel path with an opposite bearing
    const parallelPathDistance = this.findClosestParallelPath(position, bearing);

    // If no parallel path found within MAX_WIDTH_PLUS_TOLERANCE, return default width
    if (parallelPathDistance === null || parallelPathDistance > Course.MAX_WIDTH_PLUS_TOLERANCE) {
      return Course.DEFAULT_WIDTH;
    }

    // Return the distance to the parallel path
    return parallelPathDistance;
  }

  /**
   * Pre-calculates the cumulative distances for each point in the course.
   * This makes position/distance calculations more efficient.
   */
  private calculateDistances(): void {
    this.cumulativeDistances = [0]; // Start point is at distance 0
    let totalDistance = 0;

    for (let i = 1; i < this.points.length; i++) {
      const [lat1, lon1] = this.points[i - 1];
      const [lat2, lon2] = this.points[i];

      const from = turf.point([lon1, lat1]);
      const to = turf.point([lon2, lat2]);
      const segmentDistance = turf.distance(from, to, { units: 'meters' });

      totalDistance += segmentDistance;
      this.cumulativeDistances.push(totalDistance);
    }

    this.totalLength = totalDistance;
  }

  /**
   * Calculates the left and right edges of the course.
   * The left edge is the original course line, and the right edge is 2m away orthogonal to path direction.
   */
  getCourseEdges(): { leftEdge: LatLngTuple[]; rightEdge: LatLngTuple[] } {
    const leftEdge = this.points;
    const rightEdge = this.points.map((point, idx): LatLngTuple => {
      const [lat, lon] = point;

      // Determine bearing along path at this point
      let bearing: number;
      if (idx < this.points.length - 1) {
        const [lat2, lon2] = this.points[idx + 1];
        bearing = turf.bearing([lon, lat], [lon2, lat2]);
      } else {
        const [lat0, lon0] = this.points[idx - 1];
        bearing = turf.bearing([lon0, lat0], [lon, lat]);
      }

      // Calculate point 2m to the right
      const dest = turf.destination([lon, lat], 0.002, bearing + 90, { units: 'kilometers' });
      return [dest.geometry.coordinates[1], dest.geometry.coordinates[0]];
    });

    return { leftEdge, rightEdge };
  }

  /**
   * Finds the narrowest and widest parts of the course and their widths.
   */
  getCourseWidthInfo(): { narrowestWidth: number; widestWidth: number } {
    const widths: number[] = [];
    const step = 10; // Sample every 10 meters

    for (let distance = 0; distance <= this.totalLength; distance += step) {
      widths.push(this.getWidthAt(distance));
    }

    return {
      narrowestWidth: Math.min(...widths),
      widestWidth: Math.max(...widths),
    };
  }

  /**
   * Gets the bearing at a specific distance along the course.
   * @param distance Distance in meters from the start
   * @returns Bearing in degrees (0-360)
   */
  public getBearingAtDistance(distance: number): number {
    if (distance < 0 || distance > this.totalLength) {
      throw new Error('Distance is out of bounds');
    }

    // Find the segment containing this distance
    let segmentIndex = 0;
    for (let i = 0; i < this.cumulativeDistances.length - 1; i++) {
      if (distance >= this.cumulativeDistances[i] && distance < this.cumulativeDistances[i + 1]) {
        segmentIndex = i;
        break;
      }
    }

    // Get the points for this segment
    const [lat1, lon1] = this.points[segmentIndex];
    const [lat2, lon2] = this.points[segmentIndex + 1];

    // Calculate bearing using turf.js format [lon, lat]
    return turf.bearing([lon1, lat1], [lon2, lat2]);
  }
}
