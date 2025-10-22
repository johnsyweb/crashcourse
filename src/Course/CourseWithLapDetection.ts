import { Course } from './Course';

/**
 * Parameters for lap detection configuration
 */
export interface LapDetectionParams {
  stepMeters: number;
  bearingToleranceDeg: number;
  crossingToleranceMeters: number;
}

/**
 * Extended Course interface that includes lap detection methods.
 * This interface represents a Course that has lap detection capabilities.
 */
export interface CourseWithLapDetection extends Course {
  /**
   * Get current lap detection parameters
   * @returns Current lap detection configuration
   */
  getLapDetectionParams(): LapDetectionParams;

  /**
   * Update lap detection parameters and recompute crossings
   * @param params Partial parameters to update (any omitted parameter keeps its current value)
   */
  setLapDetectionParams(params: Partial<LapDetectionParams>): void;
}

/**
 * Type guard to check if a Course instance has lap detection capabilities
 * @param course The course instance to check
 * @returns True if the course has lap detection methods
 */
export function hasLapDetection(
  course: Course | null | undefined
): course is CourseWithLapDetection {
  return (
    course != null &&
    typeof (course as CourseWithLapDetection).getLapDetectionParams === 'function' &&
    typeof (course as CourseWithLapDetection).setLapDetectionParams === 'function'
  );
}
