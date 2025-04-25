import { LatLngTuple } from 'leaflet';

export class Participant {
  private position: LatLngTuple;
  private elapsedTime: number;
  private gpsPoints: LatLngTuple[];
  private pace: number; // in seconds per kilometer
  private cumulativeDistance: number = 0;

  constructor(
    gpsPoints: LatLngTuple[],
    elapsedTime: number = 0,
    pace: string = '4:00',
  ) {
    this.gpsPoints = gpsPoints;
    this.elapsedTime = elapsedTime;
    this.pace = this.parsePace(pace);
    this.position = this.calculatePosition();
  }

  private parsePace(pace: string): number {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds; // Convert pace to seconds per kilometer
  }

  private calculateSegmentDistance(
    [lat1, lon1]: LatLngTuple,
    [lat2, lon2]: LatLngTuple,
  ): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadius = 6371e3; // Earth's radius in meters

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }

  private interpolatePosition(
    [lat1, lon1]: LatLngTuple,
    [lat2, lon2]: LatLngTuple,
    distanceCovered: number,
    segmentDistance: number,
  ): LatLngTuple {
    const ratio = distanceCovered / segmentDistance;
    const lat = lat1 + ratio * (lat2 - lat1);
    const lon = lon1 + ratio * (lon2 - lon1);
    return [lat, lon];
  }

  private calculatePosition(): LatLngTuple {
    if (this.gpsPoints.length === 0) return [0, 0];

    const distanceCovered = (this.elapsedTime / this.pace) * 1000; // Distance in meters
    this.cumulativeDistance = distanceCovered;

    let cumulativeDistance = 0;
    for (let i = 1; i < this.gpsPoints.length; i++) {
      const segmentDistance = this.calculateSegmentDistance(
        this.gpsPoints[i - 1],
        this.gpsPoints[i],
      );

      if (cumulativeDistance + segmentDistance >= distanceCovered) {
        return this.interpolatePosition(
          this.gpsPoints[i - 1],
          this.gpsPoints[i],
          distanceCovered - cumulativeDistance,
          segmentDistance,
        );
      }

      cumulativeDistance += segmentDistance;
    }

    return this.gpsPoints[this.gpsPoints.length - 1];
  }

  private calculateTotalDistance(): number {
    let totalDistance = 0;
    for (let i = 1; i < this.gpsPoints.length; i++) {
      totalDistance += this.calculateSegmentDistance(
        this.gpsPoints[i - 1],
        this.gpsPoints[i],
      );
    }
    return totalDistance;
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
      totalDistance: this.calculateTotalDistance(),
    };
  }

  public reset(): void {
    this.elapsedTime = 0;
    this.position = this.gpsPoints.length > 0 ? this.gpsPoints[0] : [0, 0];
    this.cumulativeDistance = 0;
  }
}
