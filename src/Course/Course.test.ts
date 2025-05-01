import { Course } from './Course';
import { LatLngTuple } from 'leaflet';

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
      'A course must have at least two points',
    );
  });

  it('should correctly identify start and finish points', () => {
    const course = new Course(samplePoints);
    expect(course.startPoint).toEqual(samplePoints[0]);
    expect(course.finishPoint).toEqual(samplePoints[samplePoints.length - 1]);
  });

  it('should calculate the total length accurately', () => {
    const course = new Course(samplePoints);

    let expectedDistance = 0;
    for (let i = 1; i < samplePoints.length; i++) {
      const [lat1, lon1] = samplePoints[i - 1];
      const [lat2, lon2] = samplePoints[i];

      const R = 6371e3;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      expectedDistance += R * c;
    }

    expect(course.length).toBeCloseTo(expectedDistance, 0);
  });

  it('should calculate substantial, real-world distances correctly', () => {
    const course = new Course(longerCourse);

    expect(course.length).toBeGreaterThan(20000);
    expect(course.length).toBeLessThan(80000);
  });

  it('should return the correct position at a given distance', () => {
    const course = new Course(longerCourse);

    expect(course.getPositionAtDistance(0)).toEqual(course.startPoint);
    expect(course.getPositionAtDistance(course.length)).toEqual(
      course.finishPoint,
    );

    const tenKm = 10000;
    const positionAt10km = course.getPositionAtDistance(tenKm);

    expect(positionAt10km[0]).toBeGreaterThanOrEqual(
      Math.min(...longerCourse.map((p) => p[0])),
    );
    expect(positionAt10km[0]).toBeLessThanOrEqual(
      Math.max(...longerCourse.map((p) => p[0])),
    );
    expect(positionAt10km[1]).toBeGreaterThanOrEqual(
      Math.min(...longerCourse.map((p) => p[1])),
    );
    expect(positionAt10km[1]).toBeLessThanOrEqual(
      Math.max(...longerCourse.map((p) => p[1])),
    );
  });

  it('should calculate distance at a given position with significant values', () => {
    const course = new Course(longerCourse);

    const firstSegmentMidpoint: LatLngTuple = [
      (longerCourse[0][0] + longerCourse[1][0]) / 2,
      (longerCourse[0][1] + longerCourse[1][1]) / 2,
    ];

    const firstSegmentLength = course['haversineDistance'](
      longerCourse[0][0],
      longerCourse[0][1],
      longerCourse[1][0],
      longerCourse[1][1],
    );

    const distanceAtMidpoint =
      course.getDistanceAtPosition(firstSegmentMidpoint);
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

    // Validate left edge matches the original points
    expect(leftEdge).toEqual(samplePoints);

    // Validate right edge is offset by approximately 2m in longitude
    const offset = 2 / 111320; // 1 degree latitude ~ 111.32 km
    rightEdge.forEach(([lat, lon], index) => {
      expect(lat).toBeCloseTo(samplePoints[index][0], 5);
      expect(lon).toBeCloseTo(samplePoints[index][1] + offset, 5);
    });
  });

  it('should find the narrowest and widest parts of the course', () => {
    const course = new Course(samplePoints);
    const { narrowestPoint, narrowestWidth, widestPoint, widestWidth } =
      course.getCourseWidthInfo();

    // Validate narrowest and widest points are part of the course
    expect(samplePoints).toContainEqual(narrowestPoint);
    expect(samplePoints).toContainEqual(widestPoint);

    // Validate widths are reasonable
    expect(narrowestWidth).toBeGreaterThan(0);
    expect(widestWidth).toBeGreaterThan(narrowestWidth);
  });
});
