import { Course } from './Course';
import {
  CourseWithLapDetection,
  LapDetectionParams,
  hasLapDetection,
} from './CourseWithLapDetection';
import { LatLngTuple } from 'leaflet';

describe('CourseWithLapDetection', () => {
  const samplePoints: LatLngTuple[] = [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.51, -0.12],
  ];

  describe('LapDetectionParams interface', () => {
    it('should allow creating valid lap detection parameters', () => {
      const params: LapDetectionParams = {
        stepMeters: 2.5,
        bearingToleranceDeg: 45,
        crossingToleranceMeters: 1.5,
      };

      expect(params.stepMeters).toBe(2.5);
      expect(params.bearingToleranceDeg).toBe(45);
      expect(params.crossingToleranceMeters).toBe(1.5);
    });
  });

  describe('Partial<LapDetectionParams> type', () => {
    it('should allow partial updates with optional properties', () => {
      const update: Partial<LapDetectionParams> = {
        stepMeters: 3.0,
        // bearingToleranceDeg and crossingToleranceMeters are optional
      };

      expect(update.stepMeters).toBe(3.0);
      expect(update.bearingToleranceDeg).toBeUndefined();
      expect(update.crossingToleranceMeters).toBeUndefined();
    });

    it('should allow empty update object', () => {
      const update: Partial<LapDetectionParams> = {};
      expect(update).toEqual({});
    });
  });

  describe('CourseWithLapDetection interface', () => {
    let course: CourseWithLapDetection;

    beforeEach(() => {
      course = new Course(samplePoints) as CourseWithLapDetection;
    });

    it('should have getLapDetectionParams method', () => {
      expect(typeof course.getLapDetectionParams).toBe('function');
    });

    it('should have setLapDetectionParams method', () => {
      expect(typeof course.setLapDetectionParams).toBe('function');
    });

    it('should return default lap detection parameters', () => {
      const params = course.getLapDetectionParams();

      expect(params).toBeDefined();
      expect(typeof params.stepMeters).toBe('number');
      expect(typeof params.bearingToleranceDeg).toBe('number');
      expect(typeof params.crossingToleranceMeters).toBe('number');
      expect(params.stepMeters).toBeGreaterThan(0);
      expect(params.bearingToleranceDeg).toBeGreaterThanOrEqual(0);
      expect(params.crossingToleranceMeters).toBeGreaterThanOrEqual(0);
    });

    it('should update lap detection parameters', () => {
      const originalParams = course.getLapDetectionParams();
      const update: Partial<LapDetectionParams> = {
        stepMeters: 5.0,
        bearingToleranceDeg: 60,
      };

      course.setLapDetectionParams(update);
      const updatedParams = course.getLapDetectionParams();

      expect(updatedParams.stepMeters).toBe(5.0);
      expect(updatedParams.bearingToleranceDeg).toBe(60);
      expect(updatedParams.crossingToleranceMeters).toBe(originalParams.crossingToleranceMeters);
    });

    it('should handle partial parameter updates', () => {
      const originalParams = course.getLapDetectionParams();
      const update: Partial<LapDetectionParams> = {
        stepMeters: 2.0,
        // Only updating stepMeters, others should remain unchanged
      };

      course.setLapDetectionParams(update);
      const updatedParams = course.getLapDetectionParams();

      expect(updatedParams.stepMeters).toBe(2.0);
      expect(updatedParams.bearingToleranceDeg).toBe(originalParams.bearingToleranceDeg);
      expect(updatedParams.crossingToleranceMeters).toBe(originalParams.crossingToleranceMeters);
    });

    it('should handle empty parameter updates', () => {
      const originalParams = course.getLapDetectionParams();

      course.setLapDetectionParams({});
      const updatedParams = course.getLapDetectionParams();

      expect(updatedParams).toEqual(originalParams);
    });

    it('should maintain Course functionality', () => {
      // Verify that Course methods still work
      expect(course.length).toBeGreaterThan(0);
      expect(course.getPositionAtDistance(100)).toBeDefined();
      expect(course.getWidthAt(100)).toBeGreaterThan(0);
    });
  });

  describe('hasLapDetection type guard', () => {
    it('should return true for CourseWithLapDetection instances', () => {
      const course = new Course(samplePoints) as CourseWithLapDetection;
      expect(hasLapDetection(course)).toBe(true);
    });

    it('should return false for objects without lap detection methods', () => {
      const mockCourse = {
        length: 1000,
        getPositionAtDistance: () => [0, 0],
        // Missing getLapDetectionParams and setLapDetectionParams
      } as unknown as Course;

      expect(hasLapDetection(mockCourse)).toBe(false);
    });

    it('should return false for objects with only one lap detection method', () => {
      const mockCourse = {
        length: 1000,
        getPositionAtDistance: () => [0, 0],
        getLapDetectionParams: () => ({
          stepMeters: 1,
          bearingToleranceDeg: 90,
          crossingToleranceMeters: 1,
        }),
        // Missing setLapDetectionParams
      } as unknown as Course;

      expect(hasLapDetection(mockCourse)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(hasLapDetection(null)).toBe(false);
      expect(hasLapDetection(undefined)).toBe(false);
    });
  });

  describe('Integration with Course class', () => {
    it('should work with actual Course instances', () => {
      const course = new Course(samplePoints);

      // The actual Course class should implement CourseWithLapDetection
      if (hasLapDetection(course)) {
        const params = course.getLapDetectionParams();
        expect(params).toBeDefined();

        course.setLapDetectionParams({ stepMeters: 10 });
        const updatedParams = course.getLapDetectionParams();
        expect(updatedParams.stepMeters).toBe(10);
      }
    });
  });
});
