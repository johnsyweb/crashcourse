import { LatLngTuple } from 'leaflet';

const calculateTrackLength = (gpsPoints: LatLngTuple[]): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6371e3; // Earth's radius in meters

  let totalDistance = 0;

  for (let i = 1; i < gpsPoints.length; i++) {
    const [lat1, lon1] = gpsPoints[i - 1];
    const [lat2, lon2] = gpsPoints[i];

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDistance += earthRadius * c;
  }

  return totalDistance;
};

export default calculateTrackLength;
