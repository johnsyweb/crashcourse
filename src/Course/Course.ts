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
  private static readonly WIDTH_CACHE_INTERVAL = 10; // Cache width values every 10 meters (increased from 1)
  private static readonly PARALLEL_PATH_SEARCH_WINDOW = 500; // Only search for parallel paths within 500m

  private points: LatLngTuple[];
  private cumulativeDistances: number[] = [];
  private totalLength: number;
  private lineString: Feature<LineString>;
  private widthCache: Map<number, number> = new Map();
  private segmentCache: Map<number, number> = new Map(); // Cache for current segment lookups
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private totalWidthCalculations: number = 0;
  private totalCalculationTime: number = 0;

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
    this.precalculateWidths();
  }

  /**
   * Pre-calculates widths at regular intervals along the course
   */
  private precalculateWidths(): void {
    for (let distance = 0; distance <= this.totalLength; distance += Course.WIDTH_CACHE_INTERVAL) {
      this.calculateAndCacheWidth(distance);
    }
  }

  /**
   * Calculates and caches the width at a specific distance
   */
  private calculateAndCacheWidth(distance: number): number {
    const startTime = performance.now();

    // Get position and bearing at this distance
    const position = this.getPositionAtDistance(distance);
    const bearing = this.getBearingAtDistance(distance);

    // Find parallel path
    const parallelPathDistance = this.findClosestParallelPath(position, bearing);

    // Calculate width
    let width = Course.DEFAULT_WIDTH;
    if (parallelPathDistance !== null && parallelPathDistance <= Course.MAX_WIDTH_PLUS_TOLERANCE) {
      width = parallelPathDistance;
    }

    // Update performance metrics
    this.totalCalculationTime += performance.now() - startTime;
    this.totalWidthCalculations++;

    // Cache the result
    this.widthCache.set(distance, width);
    return width;
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

    // Round to nearest cache interval
    const cachedDistance =
      Math.round(distance / Course.WIDTH_CACHE_INTERVAL) * Course.WIDTH_CACHE_INTERVAL;

    // Check cache
    const cachedWidth = this.widthCache.get(cachedDistance);
    if (cachedWidth !== undefined) {
      this.cacheHits++;
      return cachedWidth;
    }

    // Cache miss - calculate and cache the width
    this.cacheMisses++;
    return this.calculateAndCacheWidth(cachedDistance);
  }

  /**
   * Gets performance statistics for width calculations
   */
  public getPerformanceStats() {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      totalWidthCalculations: this.totalWidthCalculations,
      totalCalculationTime: this.totalCalculationTime,
    };
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
    const currentSegmentIndex = this.findSegmentIndex(currentDistance);

    // Define search window
    const searchStart = Math.max(
      0,
      currentSegmentIndex -
        Math.floor(Course.PARALLEL_PATH_SEARCH_WINDOW / this.getAverageSegmentLength())
    );
    const searchEnd = Math.min(
      this.points.length - 1,
      currentSegmentIndex +
        Math.floor(Course.PARALLEL_PATH_SEARCH_WINDOW / this.getAverageSegmentLength())
    );

    // Look for segments with opposite bearings within the search window
    const segments = this.points
      .slice(searchStart, searchEnd)
      .map((startPoint, i) => {
        const absoluteIndex = i + searchStart;
        // Skip the current segment
        if (absoluteIndex === currentSegmentIndex) return null;

        const [lat1, lon1] = startPoint;
        const [lat2, lon2] = this.points[absoluteIndex + 1];

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
            return { index: absoluteIndex, distance, segment };
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

  private findSegmentIndex(distance: number): number {
    // Check cache first
    const cachedIndex = this.segmentCache.get(distance);
    if (cachedIndex !== undefined) {
      return cachedIndex;
    }

    // Binary search for the segment
    let left = 0;
    let right = this.cumulativeDistances.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (
        this.cumulativeDistances[mid] <= distance &&
        this.cumulativeDistances[mid + 1] > distance
      ) {
        this.segmentCache.set(distance, mid);
        return mid;
      }
      if (this.cumulativeDistances[mid] > distance) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    this.segmentCache.set(distance, left);
    return left;
  }

  private getAverageSegmentLength(): number {
    return this.totalLength / (this.points.length - 1);
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
  public getCourseWidthInfo(): {
    narrowestWidth: number;
    widestWidth: number;
    narrowestPoint: LatLngTuple;
    widestPoint: LatLngTuple;
  } {
    // Use cached values instead of recalculating
    let narrowestWidth = Infinity;
    let widestWidth = -Infinity;
    let narrowestPoint = this.startPoint;
    let widestPoint = this.startPoint;

    // Only check cached values
    this.widthCache.forEach((width, distance) => {
      if (width < narrowestWidth) {
        narrowestWidth = width;
        narrowestPoint = this.getPositionAtDistance(distance);
      }
      if (width > widestWidth) {
        widestWidth = width;
        widestPoint = this.getPositionAtDistance(distance);
      }
    });

    // If no cached values, calculate a minimal set
    if (narrowestWidth === Infinity || widestWidth === -Infinity) {
      const step = Course.WIDTH_CACHE_INTERVAL;
      for (let distance = 0; distance <= this.totalLength; distance += step) {
        const width = this.getWidthAt(distance);
        const position = this.getPositionAtDistance(distance);
        if (width < narrowestWidth) {
          narrowestWidth = width;
          narrowestPoint = position;
        }
        if (width > widestWidth) {
          widestWidth = width;
          widestPoint = position;
        }
      }
    }

    return {
      narrowestWidth,
      widestWidth,
      narrowestPoint,
      widestPoint,
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
