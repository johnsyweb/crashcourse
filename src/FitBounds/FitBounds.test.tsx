import { render } from '@testing-library/react';
import { FitBounds } from './FitBounds';
import { LatLngBounds } from 'leaflet';
import '@testing-library/jest-dom';

// Mock MapContainer and useMap
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
}));

describe('FitBounds Component', () => {
  const testPoints = [
    [51.505, -0.09],
    [51.51, -0.1],
    [51.51, -0.12],
  ] as [number, number][];

  it('calls map.fitBounds with the provided GPS points', () => {
    const mockFitBounds = jest.fn();
    jest.spyOn(require('react-leaflet'), 'useMap').mockReturnValue({
      fitBounds: mockFitBounds,
    });

    render(<FitBounds gpsPoints={testPoints} />);

    // Check that fitBounds was called with a LatLngBounds object
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.any(LatLngBounds),
      expect.objectContaining({
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      })
    );
  });

  it('does not call map.fitBounds when given an empty array of points', () => {
    const mockFitBounds = jest.fn();
    jest.spyOn(require('react-leaflet'), 'useMap').mockReturnValue({
      fitBounds: mockFitBounds,
    });

    render(<FitBounds gpsPoints={[]} />);

    expect(mockFitBounds).not.toHaveBeenCalled();
  });

  it('calls map.fitBounds when points are updated via re-render', () => {
    const mockFitBounds = jest.fn();
    jest.spyOn(require('react-leaflet'), 'useMap').mockReturnValue({
      fitBounds: mockFitBounds,
    });

    const initialPoints = [[51.505, -0.09]] as [number, number][];
    const { rerender } = render(<FitBounds gpsPoints={initialPoints} />);

    // First render should call fitBounds
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
    expect(mockFitBounds).toHaveBeenCalledWith(
      expect.any(LatLngBounds),
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
      expect.any(LatLngBounds),
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
