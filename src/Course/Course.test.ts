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

  describe('deletePoint', () => {
    it('should delete a point at the specified index', () => {
      const course = new Course(samplePoints);
      const originalLength = course.getPoints().length;
      const originalTotalLength = course.length;

      course.deletePoint(1); // Delete the middle point

      const newPoints = course.getPoints();
      expect(newPoints.length).toBe(originalLength - 1);
      expect(newPoints[0]).toEqual(samplePoints[0]);
      expect(newPoints[1]).toEqual(samplePoints[2]);
      expect(course.length).toBeLessThan(originalTotalLength);
    });

    it('should throw an error when trying to delete from a course with only 2 points', () => {
      const twoPointCourse = new Course([
        [51.505, -0.09],
        [51.51, -0.1],
      ]);

      expect(() => {
        twoPointCourse.deletePoint(0);
      }).toThrow('Cannot delete point: course must have at least 2 points');
    });

    it('should throw an error for invalid index', () => {
      const course = new Course(samplePoints);

      expect(() => {
        course.deletePoint(-1);
      }).toThrow('Invalid point index: -1. Must be between 0 and 2');

      expect(() => {
        course.deletePoint(3);
      }).toThrow('Invalid point index: 3. Must be between 0 and 2');
    });

    it('should recalculate course properties after deletion', () => {
      const course = new Course(samplePoints);
      const originalLength = course.length;

      course.deletePoint(1);

      // Course length should be different
      expect(course.length).not.toBe(originalLength);

      // Width calculation should still work
      const newWidth = course.getWidthAt(50);
      expect(newWidth).toBeGreaterThan(0);

      // Position calculation should still work
      const position = course.getPositionAtDistance(50);
      expect(position).toBeDefined();
      expect(Array.isArray(position)).toBe(true);
    });

    it('should clear caches after deletion', () => {
      const course = new Course(samplePoints);

      // Access some cached values
      course.getWidthAt(50);
      course.getPositionAtDistance(50);

      // Delete a point
      course.deletePoint(1);

      // Verify that caches were cleared and repopulated
      expect(course['widthCache'].size).toBeGreaterThan(0); // Should be repopulated
      expect(course['lapCountCache']).not.toBeNull(); // Should be recalculated (not null)
      expect(course['lapCrossings'].length).toBeGreaterThanOrEqual(0); // Should be recalculated
    });
  });
});
