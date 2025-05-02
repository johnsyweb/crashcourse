import { Course } from './Course';
import { LatLngTuple } from 'leaflet';
import * as turf from '@turf/turf';

describe('Course', () => {
  const samplePoints: LatLngTuple[] = [
    [-33.8568, 151.2153], // Sydney Opera House
    [-33.8523, 151.2108], // Sydney Harbour Bridge
    [-33.8568, 151.2002], // Darling Harbour
    [-33.8688, 151.2093], // Royal Botanic Garden
  ];

  const longerCourse: LatLngTuple[] = [
    [-33.8688, 151.2093], // Royal Botanic Garden, Sydney
    [-33.7737, 151.1891], // Chatswood (~10km north)
    [-33.9188, 151.2583], // Maroubra Beach (~10km southeast)
    [-33.8583, 151.0778], // Parramatta (~20km west)
  ];

  it('should create a course with valid points', () => {
    const course = new Course(samplePoints);
    expect(course).toBeDefined();
    expect(course.length).toBeGreaterThan(0);
  });

  it('should throw an error if less than two points are provided', () => {
    expect(() => new Course([[-33.8568, 151.2153]])).toThrow(
      'Course must have at least two points'
    );
  });

  it('should correctly identify start and finish points', () => {
    const course = new Course(samplePoints);
    expect(course.startPoint).toEqual(samplePoints[0]);
    expect(course.finishPoint).toEqual(samplePoints[samplePoints.length - 1]);
  });

  it('should create a valid turf.js LineString from points', () => {
    const course = new Course(samplePoints);
    // Verify we're using turf.js by checking the lineString property
    expect(course['lineString']).toBeDefined();
    expect(course['lineString'].type).toBe('Feature');
    expect(course['lineString'].geometry.type).toBe('LineString');
    expect(course['lineString'].geometry.coordinates).toEqual(
      samplePoints.map(([lat, lon]) => [lon, lat])
    );
  });

  it('should return the correct position at a given distance', () => {
    const course = new Course(longerCourse);

    expect(course.getPositionAtDistance(0)).toEqual(course.startPoint);
    expect(course.getPositionAtDistance(course.length)).toEqual(course.finishPoint);

    const tenKm = 10000;
    const positionAt10km = course.getPositionAtDistance(tenKm);

    expect(positionAt10km[0]).toBeGreaterThanOrEqual(Math.min(...longerCourse.map((p) => p[0])));
    expect(positionAt10km[0]).toBeLessThanOrEqual(Math.max(...longerCourse.map((p) => p[0])));
    expect(positionAt10km[1]).toBeGreaterThanOrEqual(Math.min(...longerCourse.map((p) => p[1])));
    expect(positionAt10km[1]).toBeLessThanOrEqual(Math.max(...longerCourse.map((p) => p[1])));
  });

  it('should calculate distance at a given position with significant values', () => {
    const course = new Course(longerCourse);

    const firstSegmentMidpoint: LatLngTuple = [
      (longerCourse[0][0] + longerCourse[1][0]) / 2,
      (longerCourse[0][1] + longerCourse[1][1]) / 2,
    ];

    const firstSegmentLength = turf.distance(
      [longerCourse[0][1], longerCourse[0][0]],
      [longerCourse[1][1], longerCourse[1][0]],
      { units: 'meters' }
    );

    const distanceAtMidpoint = course.getDistanceAtPosition(firstSegmentMidpoint);
    expect(distanceAtMidpoint).toBeGreaterThan(100);
    expect(distanceAtMidpoint).toBeCloseTo(firstSegmentLength / 2, -2);
  });

  it('should return a copy of points to prevent external modifications', () => {
    const course = new Course(samplePoints);
    const points = course.getPoints();

    points[0] = [0, 0];

    expect(course.startPoint).toEqual(samplePoints[0]);
    expect(course.getPoints()[0]).toEqual(samplePoints[0]);
  });

  it('should calculate the left and right edges of the course', () => {
    const course = new Course(samplePoints);
    const { leftEdge, rightEdge } = course.getCourseEdges();

    expect(leftEdge).toEqual(samplePoints);

    rightEdge.forEach((rightPoint, index) => {
      const leftPoint = samplePoints[index];
      const distance = turf.distance([leftPoint[1], leftPoint[0]], [rightPoint[1], rightPoint[0]], {
        units: 'meters',
      });
      expect(distance).toBeCloseTo(2, 1);
    });
  });

  it('should find the narrowest and widest parts of the course', () => {
    const course = new Course(samplePoints);
    const { narrowestWidth, widestWidth } = course.getCourseWidthInfo();

    expect(narrowestWidth).toBe(2);
    expect(widestWidth).toBe(2);
  });

  describe('getWidthAt', () => {
    const NORTH = 0;
    const EAST = 90;
    const SOUTH = 180;
    const WEST = 270;

    function createPointAtDistance(
      start: LatLngTuple,
      distance: number,
      bearing: number
    ): LatLngTuple {
      const [lat, lon] = start;
      const dest = turf.destination([lon, lat], distance / 1000, bearing, { units: 'kilometers' });
      return [dest.geometry.coordinates[1], dest.geometry.coordinates[0]];
    }

    function createZigzagCourse(): Course {
      const points: LatLngTuple[] = [];
      let currentPoint: LatLngTuple = [0, 0];
      points.push(currentPoint);

      for (let i = 0; i < 5; i++) {
        currentPoint = createPointAtDistance(currentPoint, 1, NORTH);
        points.push(currentPoint);
        currentPoint = createPointAtDistance(currentPoint, 100, EAST);
        points.push(currentPoint);
      }

      currentPoint = createPointAtDistance(currentPoint, 5, SOUTH);
      points.push(currentPoint);
      currentPoint = createPointAtDistance(currentPoint, 500, WEST);
      points.push(currentPoint);

      return new Course(points);
    }

    it('should find varying widths in a complex course', () => {
      const course = createZigzagCourse();
      const { narrowestWidth, widestWidth } = course.getCourseWidthInfo();

      expect(narrowestWidth).toBe(1);
      expect(widestWidth).toBe(4);
    });

    it('should throw error for out of bounds distance', () => {
      const course = new Course(samplePoints);
      expect(() => course.getWidthAt(-1)).toThrow('Distance is out of bounds');
      expect(() => course.getWidthAt(course.length + 1)).toThrow('Distance is out of bounds');
    });

    it('should return default width for straight course', () => {
      const start: LatLngTuple = [0, 0];
      const end = createPointAtDistance(start, 500, EAST);
      const straightCourse = new Course([start, end]);

      expect(straightCourse.length).toBeCloseTo(500, -1);

      expect(straightCourse.getWidthAt(0)).toBe(2);
      expect(straightCourse.getWidthAt(250)).toBe(2);
      expect(straightCourse.getWidthAt(499)).toBe(2);
    });

    it('should handle U-shaped course', () => {
      const start: LatLngTuple = [0, 0];
      const eastPoint = createPointAtDistance(start, 250, EAST);
      const southPoint = createPointAtDistance(eastPoint, 11, SOUTH);
      const endPoint = createPointAtDistance(southPoint, 250, WEST);

      const uCourse = new Course([start, eastPoint, southPoint, endPoint]);

      expect(uCourse.getWidthAt(0)).toBe(2);
      expect(uCourse.getWidthAt(125)).toBe(2);
      expect(uCourse.getWidthAt(350)).toBe(2);
    });

    it('should handle zigzag course with multiple parallel paths', () => {
      const zigzagCourse = createZigzagCourse();

      expect(zigzagCourse.getWidthAt(50)).toBe(1);
      expect(zigzagCourse.getWidthAt(150)).toBe(2);
      expect(zigzagCourse.getWidthAt(250)).toBe(3);
      expect(zigzagCourse.getWidthAt(350)).toBe(4);
      expect(zigzagCourse.getWidthAt(450)).toBe(2);
    });

    describe('helper methods', () => {
      it('should correctly identify opposite bearings', () => {
        const zigzagCourse = createZigzagCourse();

        const position50m = zigzagCourse.getPositionAtDistance(50);
        const bearing50m = zigzagCourse.getBearingAtDistance(50);
        const parallelPath50m = zigzagCourse['findClosestParallelPath'](position50m, bearing50m);
        expect(parallelPath50m).toBe(1);

        const position150m = zigzagCourse.getPositionAtDistance(150);
        const bearing150m = zigzagCourse.getBearingAtDistance(150);
        const parallelPath150m = zigzagCourse['findClosestParallelPath'](position150m, bearing150m);
        expect(parallelPath150m).toBe(2);

        const position250m = zigzagCourse.getPositionAtDistance(250);
        const bearing250m = zigzagCourse.getBearingAtDistance(250);
        const parallelPath250m = zigzagCourse['findClosestParallelPath'](position250m, bearing250m);
        expect(parallelPath250m).toBe(3);
      });
    });
  });
});
