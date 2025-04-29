import { LatLngTuple } from 'leaflet';
import { Course } from '../Course';

export class Participant {
  private position: LatLngTuple;
  private elapsedTime: number;
  private pace: number; // in seconds per kilometer
  private cumulativeDistance: number = 0;
  private course: Course;

  constructor(
    courseOrPoints: LatLngTuple[] | Course,
    elapsedTime: number = 0,
    pace: string = '4:00',
  ) {
    // Create course from points or use provided course
    this.course = Array.isArray(courseOrPoints)
      ? new Course(courseOrPoints)
      : courseOrPoints;

    this.elapsedTime = elapsedTime;
    this.pace = this.parsePace(pace);
    this.position = this.calculatePosition();
  }

  private parsePace(pace: string): number {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds; // Convert pace to seconds per kilometer
  }

  private calculatePosition(): LatLngTuple {
    // Calculate distance covered based on elapsed time and pace
    const distanceCovered = (this.elapsedTime / this.pace) * 1000; // Distance in meters
    this.cumulativeDistance = distanceCovered;

    // Use the Course class to find the position at this distance
    return this.course.getPositionAtDistance(distanceCovered);
  }

  private formatPace(): string {
    const minutes = Math.floor(this.pace / 60);
    const seconds = this.pace % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  public updateElapsedTime(elapsedTime: number): void {
    this.elapsedTime = elapsedTime;
    this.position = this.calculatePosition();
  }

  public getPosition(): LatLngTuple {
    return this.position;
  }

  public getProperties(): Record<string, string | number | LatLngTuple> {
    return {
      position: this.position,
      elapsedTime: this.elapsedTime,
      pace: this.formatPace(),
      cumulativeDistance: this.cumulativeDistance,
      totalDistance: this.course.length,
    };
  }

  public reset(): void {
    this.elapsedTime = 0;
    this.position = this.course.startPoint;
    this.cumulativeDistance = 0;
  }
}
