/**
 * Branded types for validated geographic coordinates
 */

// Brand tags
declare const latitudeBrand: unique symbol;
declare const longitudeBrand: unique symbol;

export type Latitude = number & { readonly [latitudeBrand]: unique symbol };
export type Longitude = number & { readonly [longitudeBrand]: unique symbol };

export interface ValidatedCoordinates {
  latitude: Latitude;
  longitude: Longitude;
}

/**
 * Validates and creates a Latitude value
 * @param value The latitude value to validate
 * @returns A validated Latitude value
 * @throws Error if the latitude is invalid
 */
export function createLatitude(value: number): Latitude {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid latitude: must be a number, got ${value}`);
  }
  if (value < -90 || value > 90) {
    throw new Error(`Invalid latitude: must be between -90 and 90 degrees, got ${value}`);
  }
  return value as Latitude;
}

/**
 * Validates and creates a Longitude value
 * @param value The longitude value to validate
 * @returns A validated Longitude value
 * @throws Error if the longitude is invalid
 */
export function createLongitude(value: number): Longitude {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid longitude: must be a number, got ${value}`);
  }
  if (value < -180 || value > 180) {
    throw new Error(`Invalid longitude: must be between -180 and 180 degrees, got ${value}`);
  }
  return value as Longitude;
}

/**
 * Validates a coordinate pair
 * @param latitude The latitude value
 * @param longitude The longitude value
 * @returns A validated coordinate pair
 * @throws Error if either coordinate is invalid
 */
export function createCoordinates(latitude: number, longitude: number): ValidatedCoordinates {
  return {
    latitude: createLatitude(latitude),
    longitude: createLongitude(longitude),
  };
}

/**
 * Safely converts a Latitude to a number for calculations
 * @param latitude The Latitude value to convert
 * @returns The numeric value
 */
export function latitudeToNumber(latitude: Latitude): number {
  return latitude;
}

/**
 * Safely converts a Longitude to a number for calculations
 * @param longitude The Longitude value to convert
 * @returns The numeric value
 */
export function longitudeToNumber(longitude: Longitude): number {
  return longitude;
}
