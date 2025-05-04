import { Course } from './Course';
import { LatLngTuple } from 'leaflet';

describe('Course', () => {
  const samplePoints: LatLngTuple[] = [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.51, -0.12],
  ];

  it('should create a course with the provided points', () => {
    const course = new Course(samplePoints);
    expect(course).toBeDefined();
  });

  it('should calculate the total length of the course', () => {
    const course = new Course(samplePoints);
    expect(course.length).toBeGreaterThan(0);
  });

  it('should find the narrowest and widest parts of the course', () => {
    const course = new Course(samplePoints);
    const { narrowestWidth, widestWidth, narrowestPoint, widestPoint } =
      course.getCourseWidthInfo();

    expect(narrowestWidth).toBe(2);
    expect(widestWidth).toBe(2);
    expect(narrowestPoint).toBeDefined();
    expect(widestPoint).toBeDefined();
    expect(Array.isArray(narrowestPoint)).toBe(true);
    expect(Array.isArray(widestPoint)).toBe(true);
    expect(narrowestPoint.length).toBe(2);
    expect(widestPoint.length).toBe(2);
  });

  it('should get the position at a given distance', () => {
    const course = new Course(samplePoints);
    const position = course.getPositionAtDistance(100);
    expect(position).toBeDefined();
    expect(Array.isArray(position)).toBe(true);
    expect(position.length).toBe(2);
  });

  it('should clamp disances to the course length', () => {
    const course = new Course(samplePoints);
    expect(course.getPositionAtDistance(-1)).toEqual(course.getPositionAtDistance(0));
    expect(course.getPositionAtDistance(course.length + 1)).toEqual(
      course.getPositionAtDistance(course.length)
    );
  });

  it('should get the width at a given distance', () => {
    const course = new Course(samplePoints);
    const width = course.getWidthAt(100);
    expect(width).toBeGreaterThan(0);
  });

  it('should handle a straight course', () => {
    const straightPoints: LatLngTuple[] = [
      [51.505, -0.09],
      [51.505, -0.1],
      [51.505, -0.11],
    ];
    const course = new Course(straightPoints);
    const width = course.getWidthAt(50);
    expect(width).toBe(2); // Default width for straight course
  });

  it('should handle a zigzag course', () => {
    const zigzagPoints: LatLngTuple[] = [
      [51.505, -0.09],
      [51.51, -0.1],
      [51.505, -0.11],
      [51.51, -0.12],
    ];
    const course = new Course(zigzagPoints);
    const width = course.getWidthAt(50);
    expect(width).toBe(2); // Default width for zigzag course
  });

  it('should get the bearing at a given distance', () => {
    const course = new Course(samplePoints);
    const bearing = course.getBearingAtDistance(100);
    expect(bearing).toBeDefined();
    expect(typeof bearing).toBe('number');
  });

  it('should find parallel paths', () => {
    const course = new Course(samplePoints);
    const position = course.getPositionAtDistance(100);
    const bearing = course.getBearingAtDistance(100);
    const parallelPath = course['findClosestParallelPath'](position, bearing);
    expect(parallelPath).toBeDefined();
    // The parallel path might be null if no parallel path is found
    if (parallelPath !== null) {
      expect(parallelPath).toBeGreaterThanOrEqual(0);
    }
  });
});
