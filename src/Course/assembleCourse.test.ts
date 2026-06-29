import { LatLngTuple } from 'leaflet';
import {
  assembleCourse,
  defaultAssemblyParamsForSegment,
  DEFAULT_PARKRUN_LENGTH_METERS,
  measurePathLengthMeters,
} from './assembleCourse';

const shortSegment: LatLngTuple[] = [
  [-37.8, 144.9],
  [-37.801, 144.901],
  [-37.802, 144.902],
];

describe('assembleCourse', () => {
  it('returns the segment unchanged when target matches segment length and mirror is off', () => {
    const segmentLength = measurePathLengthMeters(shortSegment);
    const result = assembleCourse(shortSegment, {
      targetLengthMeters: segmentLength,
      mirror: false,
    });

    expect(result.cycleCount).toBeCloseTo(1, 5);
    expect(result.assembledLengthMeters).toBeCloseTo(segmentLength, 3);
    expect(result.points.length).toBeGreaterThanOrEqual(2);
  });

  it('doubles segment length for one out-and-back cycle', () => {
    const segmentLength = measurePathLengthMeters(shortSegment);
    const result = assembleCourse(shortSegment, {
      targetLengthMeters: segmentLength * 2,
      mirror: true,
    });

    expect(result.cycleCount).toBeCloseTo(1, 5);
    expect(result.assembledLengthMeters).toBeCloseTo(segmentLength * 2, 1);
  });

  it('truncates the final leg to the target length exactly', () => {
    const segmentLength = measurePathLengthMeters(shortSegment);
    const targetLengthMeters = segmentLength * 1.5;
    const result = assembleCourse(shortSegment, {
      targetLengthMeters,
      mirror: false,
    });

    expect(result.assembledLengthMeters).toBeCloseTo(targetLengthMeters, 3);
    expect(result.cycleCount).toBeCloseTo(1.5, 5);
  });

  it('defaults target length to the segment length', () => {
    const defaults = defaultAssemblyParamsForSegment(shortSegment);
    const segmentLength = measurePathLengthMeters(shortSegment);

    expect(defaults.mirror).toBe(false);
    expect(defaults.targetLengthMeters).toBeCloseTo(segmentLength, 6);
  });

  it('defaults to parkrun length when segment is too short to measure', () => {
    const defaults = defaultAssemblyParamsForSegment([shortSegment[0]]);

    expect(defaults.targetLengthMeters).toBe(DEFAULT_PARKRUN_LENGTH_METERS);
  });
});
