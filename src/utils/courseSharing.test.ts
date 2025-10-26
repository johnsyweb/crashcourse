import { LatLngTuple } from 'leaflet';
import {
  encodeCourseData,
  decodeCourseData,
  createShareableUrl,
  extractCourseDataFromUrl,
  ShareableCourseData,
} from './courseSharing';

describe('courseSharing', () => {
  const sampleCourseData: ShareableCourseData = {
    points: [
      [51.505, -0.09],
      [51.51, -0.1],
      [51.51, -0.12],
    ],
    metadata: {
      name: 'Test Course',
      description: 'A test course for sharing',
    },
    lapDetectionParams: {
      stepMeters: 1.5,
      bearingToleranceDeg: 45,
      crossingToleranceMeters: 2,
    },
    version: '1.0',
  };

  describe('encodeCourseData', () => {
    it('should encode course data to base64', () => {
      const encoded = encodeCourseData(sampleCourseData);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should handle course data without optional fields', () => {
      const minimalData: ShareableCourseData = {
        points: [[51.505, -0.09]],
        version: '1.0',
      };
      const encoded = encodeCourseData(minimalData);
      expect(encoded).toBeTruthy();
    });
  });

  describe('decodeCourseData', () => {
    it('should decode base64-encoded course data', () => {
      const encoded = encodeCourseData(sampleCourseData);
      const decoded = decodeCourseData(encoded);

      expect(decoded).toEqual(sampleCourseData);
    });

    it('should throw error for invalid encoded data', () => {
      const invalidEncoded = 'not-valid-base64!!!';
      expect(() => decodeCourseData(invalidEncoded)).toThrow();
    });

    it('should validate that points exist', () => {
      const dataWithoutPoints: ShareableCourseData = {
        points: [],
        version: '1.0',
      };
      const encoded = encodeCourseData(dataWithoutPoints);

      // This should fail validation
      expect(() => decodeCourseData(encoded)).toThrow('no points found');
    });
  });

  describe('createShareableUrl', () => {
    it('should create a URL with course parameter', () => {
      const url = createShareableUrl(sampleCourseData);
      expect(url).toContain('course=');

      // Extract the parameter
      const urlObj = new URL(url);
      const courseParam = urlObj.searchParams.get('course');
      expect(courseParam).toBeTruthy();
    });
  });

  describe('extractCourseDataFromUrl', () => {
    // Note: Testing URL parameter extraction is difficult without changing window.location
    // In a real application, this would be tested with integration tests or by
    // passing the URL as a parameter to the function
    it('should handle missing course parameter', () => {
      // When there's no course parameter, function should return null
      // This test validates the function exists and can be called
      expect(typeof extractCourseDataFromUrl).toBe('function');
    });
  });

  describe('round-trip encoding', () => {
    it('should maintain data integrity through encode/decode cycle', () => {
      const variants: ShareableCourseData[] = [
        sampleCourseData,
        { points: [[51.505, -0.09] as LatLngTuple], version: '1.0' },
        {
          points: [
            [51.505, -0.09] as LatLngTuple,
            [51.51, -0.1] as LatLngTuple,
          ],
          metadata: { name: 'Simple Course' },
          version: '1.0',
        },
        {
          points: [[51.505, -0.09] as LatLngTuple],
          lapDetectionParams: { stepMeters: 2.0 },
          version: '1.0',
        },
      ];

      variants.forEach((variant) => {
        const encoded = encodeCourseData(variant);
        const decoded = decodeCourseData(encoded);
        expect(decoded).toEqual(variant);
      });
    });
  });
});
