import { LatLngTuple } from 'leaflet';
import { XMLParser } from 'fast-xml-parser';

interface TrackPoint {
  '@_lat': string;
  '@_lon': string;
}

export const loadGpsPoints = (fileContent: string): LatLngTuple[] => {
  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(fileContent);

  try {
    const points: LatLngTuple[] =
      result?.gpx?.trk?.trkseg?.trkpt?.map((pt: TrackPoint) => [
        parseFloat(pt['@_lat']),
        parseFloat(pt['@_lon']),
      ]) || [];
    return points;
  } catch (error) {
    throw new Error('Error extracting GPS points: ' + error);
  }
};
