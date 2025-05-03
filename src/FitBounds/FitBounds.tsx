import { LatLngTuple, LatLngBounds } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const FitBounds = ({ gpsPoints }: { gpsPoints: LatLngTuple[] }) => {
  const map = useMap();

  useEffect(() => {
    if (gpsPoints.length > 0) {
      const bounds = new LatLngBounds(gpsPoints);
      map.fitBounds(bounds, {
        padding: [50, 50], // Add 50px padding
        maxZoom: 16, // Limit max zoom level
        animate: true,
      });
    }
  }, [gpsPoints, map]);

  return null;
};
