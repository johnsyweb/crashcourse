import { LatLngTuple } from 'leaflet';
import { Course } from '../Course';

// Helper function to generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export class Participant {
  private position: LatLngTuple;
  private elapsedTime: number;
  private pace: number; // in seconds per kilometre
  private cumulativeDistance: number = 0;
  private course: Course;
  private id: string;
  private originalId: string;

  /**
   * Width of the participant in meters.
   */
  width: number;

  constructor(course: Course, elapsedTime: number = 0, pace: string = '4:00', width: number = 0.5) {
    this.course = course;
    this.elapsedTime = elapsedTime;
    this.pace = this.parsePace(pace);
    this.width = width;
    this.position = course.startPoint;
    this.id = generateId();
    this.originalId = this.id;
  }

  private parsePace(pace: string): number {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds; // Convert pace to seconds per kilometre
  }

  private formatPace(): string {
    const minutes = Math.floor(this.pace / 60);
    const seconds = this.pace % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  public getPosition(): LatLngTuple {
    return this.position;
  }

  public getProperties(): Record<string, string | number | LatLngTuple | boolean> {
    return {
      id: this.id,
      position: this.position,
      elapsedTime: this.elapsedTime,
      pace: this.formatPace(),
      cumulativeDistance: this.cumulativeDistance,
      totalDistance: this.course.length,
      finished: this.cumulativeDistance >= this.course.length,
      lap: this.course.getLapIndexAtDistance(this.cumulativeDistance),
      bearing: this.course.getBearingAtDistance(this.cumulativeDistance),
    };
  }

  public getLapIndex(): number {
    return this.course.getLapIndexAtDistance(this.cumulativeDistance);
  }

  public getId(): string {
    return this.id;
  }

  public reset(): void {
    this.elapsedTime = 0;
    this.position = this.course.startPoint;
    this.cumulativeDistance = 0;
  }

  /**
   * Updates the participant's position based on clock ticks and external factors.
   * @param tickDuration - Duration of the clock tick in seconds.
   * @param externalFactors - Optional external factors affecting movement (e.g., terrain).
   */
  public move(tickDuration: number, externalFactors: { terrainFactor?: number } = {}): void {
    const terrainFactor = externalFactors.terrainFactor || 1; // Default terrain factor is 1 (no effect)

    // Calculate distance covered during this tick
    const distanceCovered = (tickDuration / this.pace) * 1000 * terrainFactor; // Distance in metres
    // Cap the cumulative distance at the course length
    this.cumulativeDistance = Math.min(
      this.cumulativeDistance + distanceCovered,
      this.course.length
    );

    // Update position based on the new cumulative distance
    this.position = this.course.getPositionAtDistance(this.cumulativeDistance);
  }

  public getCumulativeDistance(): number {
    return this.cumulativeDistance;
  }

  public getWidth(): number {
    return this.width;
  }

  public setCumulativeDistance(distance: number): void {
    this.cumulativeDistance = distance;
    this.position = this.course.getPositionAtDistance(distance);
  }

  public getOriginalId(): string {
    return this.originalId;
  }

  public setOriginalId(id: string): void {
    this.originalId = id;
  }
}
