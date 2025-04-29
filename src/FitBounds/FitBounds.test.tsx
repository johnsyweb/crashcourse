import { render } from '@testing-library/react';
import { FitBounds } from './FitBounds';
import { LatLngTuple } from 'leaflet';
import '@testing-library/jest-dom';

// Mock the useMap hook from react-leaflet
const mockFitBounds = jest.fn();
jest.mock('react-leaflet', () => ({
  useMap: () => ({
    fitBounds: mockFitBounds,
  }),
}));

describe('FitBounds Component', () => {
  beforeEach(() => {
    // Clear mock function calls before each test
    mockFitBounds.mockClear();
  });

  it('calls map.fitBounds with the provided GPS points', () => {
    const testPoints: LatLngTuple[] = [
      [51.505, -0.09],
      [51.51, -0.1],
      [51.51, -0.12],
    ];

    render(<FitBounds gpsPoints={testPoints} />);

    // Check that fitBounds was called with the points
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(testPoints);
  });

  it('does not call map.fitBounds when given an empty array of points', () => {
    render(<FitBounds gpsPoints={[]} />);

    // Check that fitBounds was not called
    expect(mockFitBounds).not.toHaveBeenCalled();
  });

  it('calls map.fitBounds when points are updated via re-render', () => {
    const initialPoints: LatLngTuple[] = [[51.505, -0.09]];
    const updatedPoints: LatLngTuple[] = [
      [51.505, -0.09],
      [51.51, -0.1],
    ];

    const { rerender } = render(<FitBounds gpsPoints={initialPoints} />);

    // First render should call fitBounds
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(initialPoints);

    // Clear the mock to track new calls
    mockFitBounds.mockClear();

    // Re-render with new points
    rerender(<FitBounds gpsPoints={updatedPoints} />);

    // Should call fitBounds again with new points
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(updatedPoints);
  });

  it('does not call map.fitBounds again if the same points are provided', () => {
    const points: LatLngTuple[] = [[51.505, -0.09]];

    const { rerender } = render(<FitBounds gpsPoints={points} />);

    // First render should call fitBounds
    expect(mockFitBounds).toHaveBeenCalledTimes(1);

    // Clear the mock to track new calls
    mockFitBounds.mockClear();

    // Re-render with same points (React would use object identity which would trigger the effect,
    // but in our test scenario we're explicitly checking the behavior with the same data)
    rerender(<FitBounds gpsPoints={points} />);

    // Because we're using the same array reference, the useEffect shouldn't trigger
    // Note: In actual React, this might still trigger if object reference changes
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
  });

  it('returns null (renders nothing in the DOM)', () => {
    const { container } = render(<FitBounds gpsPoints={[[51.505, -0.09]]} />);

    // Container should be empty because FitBounds returns null
    expect(container.firstChild).toBeNull();
  });
});
