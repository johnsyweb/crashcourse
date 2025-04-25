import { LatLngTuple } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const FitBounds = ({ gpsPoints }: { gpsPoints: LatLngTuple[]; }) => {
  const map = useMap();

  useEffect(() => {
    if (gpsPoints.length > 0) {
      const bounds: LatLngTuple[] = gpsPoints.map(([lat, lon]) => [lat, lon]);
      map.fitBounds(bounds);
    }
  }, [gpsPoints, map]);

  return null;
};
