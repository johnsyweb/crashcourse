import { LatLngTuple } from 'leaflet';

/**
 * Represents a course for an event, defined by a series of GPS points.
 */
export class Course {
  private points: LatLngTuple[];
  private cumulativeDistances: number[] = [];
  private totalLength: number = 0;

  /**
   * Creates a new Course instance from an array of GPS points.
   * @param points - Array of latitude/longitude points defining the course
   */
  constructor(points: LatLngTuple[]) {
    if (points.length < 2) {
      throw new Error('A course must have at least two points');
    }

    this.points = [...points]; // Create a copy to avoid external mutations
    this.calculateDistances();
  }

  /**
   * Gets the start point of the course.
   */
  get startPoint(): LatLngTuple {
    return this.points[0];
  }

  /**
   * Gets the finish point of the course.
   */
  get finishPoint(): LatLngTuple {
    return this.points[this.points.length - 1];
  }

  /**
   * Gets the total length of the course in meters.
   */
  get length(): number {
    return this.totalLength;
  }

  /**
   * Gets all points in the course.
   */
  getPoints(): LatLngTuple[] {
    return [...this.points]; // Return a copy to prevent external modifications
  }

  /**
   * Finds the coordinates at a specified distance from the start.
   * @param distance - Distance in meters from the start
   * @returns The coordinates (latitude, longitude) at the specified distance
   */
  getPositionAtDistance(distance: number): LatLngTuple {
    if (distance <= 0) {
      return this.startPoint;
    }

    if (distance >= this.totalLength) {
      return this.finishPoint;
    }

    // Find the segment containing the target distance
    let segmentIndex = 0;
    while (
      segmentIndex < this.cumulativeDistances.length - 1 &&
      this.cumulativeDistances[segmentIndex + 1] < distance
    ) {
      segmentIndex++;
    }

    // Calculate how far along the segment the target distance is
    const segmentStart = this.cumulativeDistances[segmentIndex];
    const segmentEnd = this.cumulativeDistances[segmentIndex + 1];
    const segmentProgress =
      (distance - segmentStart) / (segmentEnd - segmentStart);

    // Interpolate between the points
    const [lat1, lon1] = this.points[segmentIndex];
    const [lat2, lon2] = this.points[segmentIndex + 1];

    const latitude = lat1 + segmentProgress * (lat2 - lat1);
    const longitude = lon1 + segmentProgress * (lon2 - lon1);

    return [latitude, longitude];
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

      const closestPoint = this.findClosestPointOnSegment(
        targetLat,
        targetLon,
        lat1,
        lon1,
        lat2,
        lon2,
      );

      const distToClosest = this.haversineDistance(
        targetLat,
        targetLon,
        closestPoint[0],
        closestPoint[1],
      );

      if (distToClosest < minDistance) {
        minDistance = distToClosest;

        // Calculate distance along the course to this point
        const distAlongSegment = this.haversineDistance(
          lat1,
          lon1,
          closestPoint[0],
          closestPoint[1],
        );
        closestSegmentDistance = this.cumulativeDistances[i] + distAlongSegment;
      }
    }

    return closestSegmentDistance;
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

      totalDistance += this.haversineDistance(lat1, lon1, lat2, lon2);
      this.cumulativeDistances.push(totalDistance);
    }

    this.totalLength = totalDistance;
  }

  /**
   * Calculates the distance between two points using the Haversine formula.
   * @param lat1 - Latitude of the first point
   * @param lon1 - Longitude of the first point
   * @param lat2 - Latitude of the second point
   * @param lon2 - Longitude of the second point
   * @returns Distance in meters
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Finds the closest point on a line segment to a target point.
   */
  private findClosestPointOnSegment(
    targetLat: number,
    targetLon: number,
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): LatLngTuple {
    // Convert to Cartesian coordinates for simpler calculations
    const x = targetLon;
    const y = targetLat;
    const x1 = lon1;
    const y1 = lat1;
    const x2 = lon2;
    const y2 = lat2;

    // Calculate the squared length of the segment
    const segmentLengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);

    // If segment is just a point, return the segment start
    if (segmentLengthSquared === 0) return [lat1, lon1];

    // Calculate the projection scalar
    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / segmentLengthSquared,
      ),
    );

    // Calculate the closest point
    const closestLon = x1 + t * (x2 - x1);
    const closestLat = y1 + t * (y2 - y1);

    return [closestLat, closestLon];
  }

  /**
   * Calculates the left and right edges of the course.
   * The left edge is the original course line, and the right edge is 2m away.
   * If the course overlaps, the furthest left and right edges are calculated.
   */
  getCourseEdges(): { leftEdge: LatLngTuple[]; rightEdge: LatLngTuple[] } {
    const leftEdge = this.points;
    const rightEdge = this.points.map(([lat, lon]) => {
      // Approximate 2m to degrees (latitude/longitude)
      const offset = 2 / 111320; // 1 degree latitude ~ 111.32 km
      return [lat, lon + offset];
    });

    return { leftEdge, rightEdge };
  }
}
