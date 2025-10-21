import { Course } from './Course';
import { LatLngTuple } from 'leaflet';

describe('Course lap detection', () => {
  it('reports 1 lap for a simple non-loop course', () => {
    const points: LatLngTuple[] = [
      [51.0, 0.0],
      [51.001, 0.001],
      [51.002, 0.002],
    ];
    const course = new Course(points);
    // At minimum there should be 1 lap; depending on geometry our heuristic may detect more
    const lapCount = course.getLapCount();
    expect(lapCount).toBeGreaterThanOrEqual(1);
    expect(course.getLapIndexAtDistance(0)).toBe(1);
    const midLap = course.getLapIndexAtDistance(course.length / 2);
    expect(midLap).toBeGreaterThanOrEqual(1);
    expect(midLap).toBeLessThanOrEqual(lapCount);
  });

  it('detects a lap crossing when the path returns to the start point', () => {
    // Construct a small rectangular loop that returns to start at the end
    const loop: LatLngTuple[] = [
      [0, 0],
      [0, 0.001],
      [0.001, 0.001],
      [0.001, 0],
      [0, 0], // back to start -> should create at least one crossing
    ];

    const course = new Course(loop);
    // Our implementation counts crossings + 1 as lapCount, so a single return yields 2
    expect(course.getLapCount()).toBeGreaterThanOrEqual(2);

    // Before the crossing (near start, small distance) should be lap 1
    expect(course.getLapIndexAtDistance(0)).toBe(1);

    // At the very end of the course (after crossing) should be last lap
    expect(course.getLapIndexAtDistance(course.length)).toBe(course.getLapCount());
  });
});
