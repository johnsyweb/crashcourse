import { render } from '@testing-library/react';
import { LatLngBounds, Map } from 'leaflet';
import { FitBounds } from './FitBounds';
import { useMap } from 'react-leaflet';
import '@testing-library/jest-dom';

// Mock the useMap hook
jest.mock('react-leaflet', () => ({
  useMap: jest.fn(),
}));

describe('FitBounds Component', () => {
  const testPoints = [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.51, -0.12],
  ] as [number, number][];

  it('calls map.fitBounds with the provided GPS points', () => {
    const mockFitBounds = jest.fn();
    (useMap as jest.Mock).mockReturnValue({
      fitBounds: mockFitBounds,
    } as unknown as Map);

    render(<FitBounds gpsPoints={testPoints} />);

    // Check that fitBounds was called with a LatLngBounds object
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.objectContaining({
        extend: expect.any(Function),
        isValid: expect.any(Function),
      }),
      expect.objectContaining({
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      })
    );
  });

  it('does not call map.fitBounds when given an empty array of points', () => {
    const mockFitBounds = jest.fn();
    (useMap as jest.Mock).mockReturnValue({
      fitBounds: mockFitBounds,
    } as unknown as Map);

    render(<FitBounds gpsPoints={[]} />);

    expect(mockFitBounds).not.toHaveBeenCalled();
  });

  it('calls map.fitBounds when points are updated via re-render', () => {
    const mockFitBounds = jest.fn();
    (useMap as jest.Mock).mockReturnValue({
      fitBounds: mockFitBounds,
    } as unknown as Map);

    const initialPoints = [[51.505, -0.09]] as [number, number][];
    const { rerender } = render(<FitBounds gpsPoints={initialPoints} />);

    // First render should call fitBounds
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.objectContaining({
        extend: expect.any(Function),
        isValid: expect.any(Function),
      }),
      expect.objectContaining({
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      })
    );

    // Clear the mock to track new calls
    mockFitBounds.mockClear();

    // Update points and re-render
    const newPoints = [[51.51, -0.1]] as [number, number][];
    rerender(<FitBounds gpsPoints={newPoints} />);

    // Should call fitBounds again with new points
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.objectContaining({
        extend: expect.any(Function),
        isValid: expect.any(Function),
      }),
      expect.objectContaining({
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      })
    );
  });

  it('returns null (renders nothing in the DOM)', () => {
    const { container } = render(<FitBounds gpsPoints={[[51.505, -0.09]]} />);

    // Container should be empty because FitBounds returns null
    expect(container.firstChild).toBeNull();
  });
});
