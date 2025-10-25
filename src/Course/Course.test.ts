import { Course } from './Course';
import { LatLngTuple } from 'leaflet';
import * as turf from '@turf/turf';

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

  describe('movePoint', () => {
    it('should move a point to a new location', () => {
      const course = new Course(samplePoints);
      const newPoint: LatLngTuple = [51.52, -0.11];

      course.movePoint(1, newPoint);

      expect(course.getPoints()[1]).toEqual(newPoint);
      expect(course.getPoints()).toHaveLength(3);
    });

    it('should recalculate distances and bearings after moving a point', () => {
      const course = new Course(samplePoints);
      const newPoint: LatLngTuple = [51.52, -0.11];

      course.movePoint(1, newPoint);

      // The course should still be valid with recalculated distances
      expect(course.totalLength).toBeGreaterThan(0);
      expect(course.getPoints()).toHaveLength(3);
    });

    it('should throw error for invalid point', () => {
      const course = new Course(samplePoints);

      expect(() => course.movePoint(1, [91, -0.11])).toThrow('Invalid latitude');
      expect(() => course.movePoint(1, [51.52, 181])).toThrow('Invalid longitude');
      expect(() => course.movePoint(1, [51.52])).toThrow('Invalid point');
    });

    it('should throw error for invalid index', () => {
      const course = new Course(samplePoints);

      expect(() => course.movePoint(-1, [51.52, -0.11])).toThrow('Invalid index');
      expect(() => course.movePoint(3, [51.52, -0.11])).toThrow('Invalid index');
    });

    it('should remove consecutive duplicates after moving', () => {
      const course = new Course(samplePoints);
      const duplicatePoint = course.getPoints()[0];

      course.movePoint(1, duplicatePoint);

      // Should remove the duplicate and have 2 points instead of 3
      expect(course.getPoints()).toHaveLength(2);
    });
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

  describe('addPoint', () => {
    it('should add a point at the end when no index is provided', () => {
      const course = new Course(samplePoints);
      const originalLength = course.length;
      const newPoint: LatLngTuple = [51.506, -0.127];

      course.addPoint(newPoint);

      expect(course.getPoints()).toHaveLength(samplePoints.length + 1);
      expect(course.getPoints()[course.getPoints().length - 1]).toEqual(newPoint);
      expect(course.length).not.toBe(originalLength);
    });

    it('should add a point at the specified index', () => {
      const course = new Course(samplePoints);
      const newPoint: LatLngTuple = [51.506, -0.127];
      const insertIndex = 2;

      course.addPoint(newPoint, insertIndex);

      expect(course.getPoints()).toHaveLength(samplePoints.length + 1);
      expect(course.getPoints()[insertIndex]).toEqual(newPoint);
    });

    it('should add a point at the beginning when index is 0', () => {
      const course = new Course(samplePoints);
      const newPoint: LatLngTuple = [51.506, -0.127];

      course.addPoint(newPoint, 0);

      expect(course.getPoints()).toHaveLength(samplePoints.length + 1);
      expect(course.getPoints()[0]).toEqual(newPoint);
    });

    it('should throw error for invalid point format', () => {
      const course = new Course(samplePoints);

      expect(() => course.addPoint([51.505] as unknown as LatLngTuple)).toThrow(
        'Invalid point: must be [latitude, longitude] with numeric values'
      );
      expect(() => course.addPoint(['51.505', '-0.127'] as unknown as LatLngTuple)).toThrow(
        'Invalid point: must be [latitude, longitude] with numeric values'
      );
      expect(() => course.addPoint(null as unknown as LatLngTuple)).toThrow(
        'Invalid point: must be [latitude, longitude] with numeric values'
      );
    });

    it('should throw error for invalid latitude', () => {
      const course = new Course(samplePoints);

      expect(() => course.addPoint([91, -0.127])).toThrow(
        'Invalid latitude: must be between -90 and 90 degrees'
      );
      expect(() => course.addPoint([-91, -0.127])).toThrow(
        'Invalid latitude: must be between -90 and 90 degrees'
      );
    });

    it('should throw error for invalid longitude', () => {
      const course = new Course(samplePoints);

      expect(() => course.addPoint([51.505, 181])).toThrow(
        'Invalid longitude: must be between -180 and 180 degrees'
      );
      expect(() => course.addPoint([51.505, -181])).toThrow(
        'Invalid longitude: must be between -180 and 180 degrees'
      );
    });

    it('should throw error for invalid index', () => {
      const course = new Course(samplePoints);
      const newPoint: LatLngTuple = [51.506, -0.127];

      expect(() => course.addPoint(newPoint, -1)).toThrow(
        'Invalid insert index: -1. Must be between 0 and'
      );
      expect(() => course.addPoint(newPoint, course.getPoints().length + 1)).toThrow(
        'Invalid insert index:'
      );
    });

    it('should recalculate course properties after adding point', () => {
      const course = new Course(samplePoints);
      const originalLength = course.length;
      const newPoint: LatLngTuple = [51.506, -0.127];

      course.addPoint(newPoint);

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

    it('should clear caches after adding point', () => {
      const course = new Course(samplePoints);

      // Access some cached values
      course.getWidthAt(50);
      course.getPositionAtDistance(50);

      // Add a point
      const newPoint: LatLngTuple = [51.506, -0.127];
      course.addPoint(newPoint);

      // Verify that caches were cleared and repopulated
      expect(course['widthCache'].size).toBeGreaterThan(0); // Should be repopulated
      expect(course['lapCountCache']).not.toBeNull(); // Should be recalculated (not null)
      expect(course['lapCrossings'].length).toBeGreaterThanOrEqual(0); // Should be recalculated
    });

    it('should remove consecutive duplicate points', () => {
      const course = new Course(samplePoints);
      const duplicatePoint = course.getPoints()[1]; // Use an existing point

      course.addPoint(duplicatePoint, 1);

      // Should not increase the length since duplicates are removed
      expect(course.getPoints()).toHaveLength(samplePoints.length);
    });

    it('should recalculate distances and bearings correctly when adding at position 0', () => {
      // Create a simple 2-point course for testing
      const twoPointCourse = [
        [-37.816715, 144.876736], // Point 0
        [-37.816893, 144.876788], // Point 1
      ];
      const course = new Course(twoPointCourse);

      // Get original bearing from point 0 to point 1
      const originalBearing = course.getBearingAtDistance(0);

      // Calculate a point 10m before the original start point
      // Using turf.js to extend backwards from point 0 towards point 1
      const bearing = turf.bearing(
        turf.point([twoPointCourse[0][1], twoPointCourse[0][0]]),
        turf.point([twoPointCourse[1][1], twoPointCourse[1][0]])
      );
      const destination = turf.destination(
        turf.point([twoPointCourse[0][1], twoPointCourse[0][0]]),
        -0.01, // -10m in kilometers (negative to go backwards)
        bearing,
        { units: 'kilometers' }
      );
      const newPoint: LatLngTuple = [
        destination.geometry.coordinates[1],
        destination.geometry.coordinates[0],
      ];

      // Add the new point at position 0
      course.addPoint(newPoint, 0);

      // Verify the course now has 3 points
      expect(course.getPoints()).toHaveLength(3);

      // Verify the new point is at position 0
      expect(course.getPoints()[0]).toEqual(newPoint);

      // Verify the original first point is now at position 1
      expect(course.getPoints()[1]).toEqual(twoPointCourse[0]);

      // Verify the original second point is now at position 2
      expect(course.getPoints()[2]).toEqual(twoPointCourse[1]);

      // Verify distance from new point 0 to original point 0 (now point 1) is approximately 10m
      const distanceToOriginalStart = course['cumulativeDistances'][1];
      expect(distanceToOriginalStart).toBeCloseTo(10, 1); // Within 0.1m

      // Verify bearing from new point 0 to original point 0 (now point 1) matches original bearing
      const newBearing = course.getBearingAtDistance(0);
      expect(newBearing).toBeCloseTo(originalBearing, 1); // Within 0.1 degrees
    });
  });
});
