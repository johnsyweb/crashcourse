import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import type { CongestionPoint } from '../CongestionPoint/types';

interface CongestionPointsLayerProps {
  congestionPoints: CongestionPoint[];
  selectedCongestionPointId?: string | null;
  onCongestionPointClick?: (point: CongestionPoint) => void;
}

const CongestionPointsLayer: React.FC<CongestionPointsLayerProps> = ({
  congestionPoints,
  selectedCongestionPointId,
  onCongestionPointClick,
}) => {
  // Calculate marker size based on count (min 5px, max 30px)
  // Use square root scaling to make size proportional but not too large
  const getMarkerRadius = (count: number): number => {
    const minRadius = 5;
    const maxRadius = 30;
    const minCount = 1;
    const maxCount = Math.max(...congestionPoints.map((p) => p.count), 1);

    if (maxCount === minCount) {
      return minRadius;
    }

    // Use square root scaling for better visual representation
    const normalizedCount = Math.sqrt(count) / Math.sqrt(maxCount);
    return minRadius + (maxRadius - minRadius) * normalizedCount;
  };

  return (
    <>
      {congestionPoints.map((point) => {
        const isSelected = selectedCongestionPointId === point.id;
        const radius = getMarkerRadius(point.count);

        return (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={radius}
            pathOptions={{
              color: isSelected ? '#f7a541' : '#4c1a57',
              fillColor: isSelected ? '#f7a541' : '#4c1a57',
              fillOpacity: isSelected ? 0.8 : 0.6,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => {
                if (onCongestionPointClick) {
                  onCongestionPointClick(point);
                }
              },
            }}
          >
            <Popup>
              <div>
                <strong>Congestion Point</strong>
                <br />
                Occurrences: {point.count}
                <br />
                Distance:{' '}
                {point.distance < 1000
                  ? `${point.distance.toFixed(1)} m`
                  : `${(point.distance / 1000).toFixed(2)} km`}
                <br />
                Lat: {point.latitude.toFixed(6)}
                <br />
                Lon: {point.longitude.toFixed(6)}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

export default CongestionPointsLayer;
