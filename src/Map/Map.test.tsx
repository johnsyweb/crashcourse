import React from 'react';
import { render, screen } from '@testing-library/react';
import Map from './Map';
import '@testing-library/jest-dom';
import * as FitBoundsModule from '../FitBounds';
import { LatLngTuple } from 'leaflet';

// Mock the CSS module
jest.mock('./Map.module.css', () => ({
  mapWrapper: 'mapWrapper',
  mapContainer: 'mapContainer',
}));

// Define interfaces for the mock components
interface MapContainerProps {
  children: React.ReactNode;
  center: LatLngTuple;
  zoom: number;
  className: string;
}

interface TileLayerProps {
  url: string;
  attribution: string;
}

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, className }: MapContainerProps) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      className={className}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: TileLayerProps) => (
    <div
      data-testid="tile-layer"
      data-url={url}
      data-attribution={attribution}
    />
  ),
  // Mock useMap hook that FitBounds uses
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
}));

describe('Map Component', () => {
  // Create a spy on the FitBounds component before each test
  let fitBoundsSpy: jest.SpyInstance;

  beforeEach(() => {
    // Instead of using mockImplementation, we'll use mockReturnValue
    // This addresses the type mismatch since we're not changing the component function itself
    fitBoundsSpy = jest.spyOn(FitBoundsModule, 'FitBounds');

    // Use a function that adds a test marker to the DOM for verification
    // while still preserving the original return type (null)
    fitBoundsSpy.mockImplementation(({ gpsPoints }) => {
      // Add a div to the document for testing purposes only
      const div = document.createElement('div');
      div.setAttribute('data-testid', 'fit-bounds');
      div.setAttribute('data-points', JSON.stringify(gpsPoints));
      document.body.appendChild(div);

      // Actual component returns null
      return null;
    });
  });

  afterEach(() => {
    fitBoundsSpy.mockRestore();

    // Clean up any elements we added to the body
    const element = document.querySelector('[data-testid="fit-bounds"]');
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('renders the map container with default props', () => {
    render(<Map />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();

    // Check default center and zoom values
    expect(mapContainer).toHaveAttribute('data-center', JSON.stringify([0, 0]));
    expect(mapContainer).toHaveAttribute('data-zoom', '2');

    // Check if tile layer is rendered
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toBeInTheDocument();
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
  });

  it('renders the map container with custom props', () => {
    const customCenter: [number, number] = [51.505, -0.09];
    const customZoom = 13;

    render(
      <Map
        initialCenter={customCenter}
        initialZoom={customZoom}
        className="custom-map"
      />,
    );

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute(
      'data-center',
      JSON.stringify(customCenter),
    );
    expect(mapContainer).toHaveAttribute('data-zoom', customZoom.toString());

    const mapWrapper = mapContainer.parentElement;
    expect(mapWrapper).toHaveClass('custom-map');
  });

  it('renders children components inside the map', () => {
    render(
      <Map>
        <div data-testid="child-component">Test Child</div>
      </Map>,
    );

    const childComponent = screen.getByTestId('child-component');
    expect(childComponent).toBeInTheDocument();
    expect(childComponent).toHaveTextContent('Test Child');
  });

  it('renders FitBounds component when gpsPoints are provided', () => {
    const testPoints: [number, number][] = [
      [51.505, -0.09],
      [51.51, -0.1],
      [51.51, -0.12],
    ];

    render(<Map gpsPoints={testPoints} />);

    // Verify FitBounds was called with the correct props
    expect(fitBoundsSpy).toHaveBeenCalled();
    expect(fitBoundsSpy.mock.calls[0][0]).toEqual({ gpsPoints: testPoints });

    const fitBounds = screen.getByTestId('fit-bounds');
    expect(fitBounds).toBeInTheDocument();
    expect(fitBounds).toHaveAttribute(
      'data-points',
      JSON.stringify(testPoints),
    );
  });

  it('does not render FitBounds when no gpsPoints are provided', () => {
    render(<Map />);

    expect(screen.queryByTestId('fit-bounds')).not.toBeInTheDocument();
    expect(fitBoundsSpy).not.toHaveBeenCalled();
  });

  it('does not render FitBounds when gpsPoints array is empty', () => {
    render(<Map gpsPoints={[]} />);

    expect(screen.queryByTestId('fit-bounds')).not.toBeInTheDocument();
    expect(fitBoundsSpy).not.toHaveBeenCalled();
  });

  it('applies custom and default classes to the wrapper', () => {
    render(<Map className="custom-map-class" />);

    // Get the outer div which should have both the default and custom classes
    const mapWrapper = screen.getByTestId('map-container').parentElement;
    expect(mapWrapper).toHaveClass('custom-map-class');
    // This assumes your CSS module is mocked and the class name is as-is
    expect(mapWrapper).toHaveClass('mapWrapper');
  });
});
