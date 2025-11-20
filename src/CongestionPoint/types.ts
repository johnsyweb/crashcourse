/**
 * Represents a congestion point on the course where participants were blocked from overtaking
 */
export interface CongestionPoint {
  /**
   * Unique identifier for this congestion point
   */
  id: string;
  /**
   * Latitude coordinate
   */
  latitude: number;
  /**
   * Longitude coordinate
   */
  longitude: number;
  /**
   * Distance along the course in meters where congestion occurred
   */
  distance: number;
  /**
   * Number of times congestion has occurred at this location
   */
  count: number;
}
