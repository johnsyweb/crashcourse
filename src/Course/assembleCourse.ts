import { LatLngTuple } from 'leaflet';
import * as turf from '@turf/turf';

export interface CourseAssemblyParams {
  targetLengthMeters: number;
  mirror: boolean;
}

export interface CourseAssemblyResult {
  points: LatLngTuple[];
  segmentLengthMeters: number;
  unitLengthMeters: number;
  cycleCount: number;
  assembledLengthMeters: number;
}

export const DEFAULT_PARKRUN_LENGTH_METERS = 5000;

export function measurePathLengthMeters(points: LatLngTuple[]): number {
  if (points.length < 2) {
    return 0;
  }

  const lineString = turf.lineString(points.map(([lat, lon]) => [lon, lat]));
  return turf.length(lineString, { units: 'meters' });
}

export function defaultAssemblyParamsForSegment(segment: LatLngTuple[]): CourseAssemblyParams {
  const segmentLengthMeters = measurePathLengthMeters(segment);
  return {
    targetLengthMeters:
      segmentLengthMeters > 0 ? segmentLengthMeters : DEFAULT_PARKRUN_LENGTH_METERS,
    mirror: false,
  };
}

function reverseSegment(points: LatLngTuple[]): LatLngTuple[] {
  return [...points].reverse();
}

function appendLeg(chain: LatLngTuple[], leg: LatLngTuple[]): LatLngTuple[] {
  if (leg.length === 0) {
    return chain;
  }

  if (chain.length === 0) {
    return [...leg];
  }

  const last = chain[chain.length - 1];
  const first = leg[0];
  const skipFirst = last[0] === first[0] && last[1] === first[1];
  return [...chain, ...leg.slice(skipFirst ? 1 : 0)];
}

function truncateToLength(points: LatLngTuple[], targetMeters: number): LatLngTuple[] {
  if (points.length < 2) {
    return points;
  }

  const totalLength = measurePathLengthMeters(points);
  if (totalLength <= targetMeters) {
    return points;
  }

  const result: LatLngTuple[] = [points[0]];
  let accumulated = 0;

  for (let index = 1; index < points.length; index += 1) {
    const from = turf.point([points[index - 1][1], points[index - 1][0]]);
    const to = turf.point([points[index][1], points[index][0]]);
    const segmentLength = turf.distance(from, to, { units: 'meters' });

    if (accumulated + segmentLength >= targetMeters) {
      const remaining = targetMeters - accumulated;
      const fraction = remaining / segmentLength;
      const lat = points[index - 1][0] + (points[index][0] - points[index - 1][0]) * fraction;
      const lon = points[index - 1][1] + (points[index][1] - points[index - 1][1]) * fraction;
      result.push([lat, lon]);
      return result;
    }

    accumulated += segmentLength;
    result.push(points[index]);
  }

  return result;
}

export function assembleCourse(
  segment: LatLngTuple[],
  params: CourseAssemblyParams
): CourseAssemblyResult {
  if (segment.length < 2) {
    throw new Error('Segment must contain at least 2 GPS points.');
  }

  if (params.targetLengthMeters <= 0) {
    throw new Error('Target course length must be greater than zero.');
  }

  const segmentLengthMeters = measurePathLengthMeters(segment);
  const unitLengthMeters = params.mirror ? segmentLengthMeters * 2 : segmentLengthMeters;

  if (unitLengthMeters <= 0) {
    throw new Error('Submitted segment has no measurable length.');
  }

  const cycleCount = params.targetLengthMeters / unitLengthMeters;
  const legCount = params.mirror ? Math.ceil(cycleCount) * 2 : Math.ceil(cycleCount);

  let chained: LatLngTuple[] = [];
  for (let legIndex = 0; legIndex < legCount; legIndex += 1) {
    const forward = legIndex % 2 === 0 || !params.mirror;
    const leg = forward ? segment : reverseSegment(segment);
    chained = appendLeg(chained, leg);
  }

  const points = truncateToLength(chained, params.targetLengthMeters);

  return {
    points,
    segmentLengthMeters,
    unitLengthMeters,
    cycleCount,
    assembledLengthMeters: measurePathLengthMeters(points),
  };
}
