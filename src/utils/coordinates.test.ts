import { createLatitude, createLongitude, createCoordinates } from './coordinates';

describe('createLatitude', () => {
  it('should accept valid latitude values', () => {
    expect(createLatitude(0)).toBe(0);
    expect(createLatitude(90)).toBe(90);
    expect(createLatitude(-90)).toBe(-90);
    expect(createLatitude(45.5)).toBe(45.5);
  });

  it('should reject latitude values outside valid range', () => {
    expect(() => createLatitude(91)).toThrow('Invalid latitude');
    expect(() => createLatitude(-91)).toThrow('Invalid latitude');
    expect(() => createLatitude(100)).toThrow('Invalid latitude');
  });

  it('should reject non-numeric values', () => {
    expect(() => createLatitude(NaN)).toThrow('Invalid latitude');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => createLatitude('45' as any)).toThrow('Invalid latitude');
  });
});

describe('createLongitude', () => {
  it('should accept valid longitude values', () => {
    expect(createLongitude(0)).toBe(0);
    expect(createLongitude(180)).toBe(180);
    expect(createLongitude(-180)).toBe(-180);
    expect(createLongitude(45.5)).toBe(45.5);
  });

  it('should reject longitude values outside valid range', () => {
    expect(() => createLongitude(181)).toThrow('Invalid longitude');
    expect(() => createLongitude(-181)).toThrow('Invalid longitude');
    expect(() => createLongitude(200)).toThrow('Invalid longitude');
  });

  it('should reject non-numeric values', () => {
    expect(() => createLongitude(NaN)).toThrow('Invalid longitude');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => createLongitude('45' as any)).toThrow('Invalid longitude');
  });
});

describe('createCoordinates', () => {
  it('should create valid coordinates', () => {
    const coords = createCoordinates(-37.8144, 144.9631);
    expect(coords.latitude).toBe(-37.8144);
    expect(coords.longitude).toBe(144.9631);
  });

  it('should reject invalid coordinates', () => {
    expect(() => createCoordinates(91, 0)).toThrow('Invalid latitude');
    expect(() => createCoordinates(0, 181)).toThrow('Invalid longitude');
    expect(() => createCoordinates(NaN, 0)).toThrow('Invalid latitude');
    expect(() => createCoordinates(0, NaN)).toThrow('Invalid longitude');
  });
});
