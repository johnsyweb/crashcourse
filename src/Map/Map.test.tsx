import React from 'react';
import { render, screen } from '@testing-library/react';
import Map from './Map';
import '@testing-library/jest-dom';
import { LatLngTuple } from 'leaflet';

// Mock the CSS module
jest.mock('./Map.module.css', () => ({
  mapWrapper: 'mapWrapper',
  mapContainer: 'mapContainer',
}));

// Mock the FitBounds component completely instead of using spyOn
jest.mock('../FitBounds', () => ({
  FitBounds: jest.fn(({ gpsPoints }) => {
    if (gpsPoints && gpsPoints.length > 0) {
      // Add a div to the document for testing purposes only
      const div = document.createElement('div');
      div.setAttribute('data-testid', 'fit-bounds');
      div.setAttribute('data-points', JSON.stringify(gpsPoints));
      document.body.appendChild(div);
    }
    return null;
  }),
}));

// Get the mocked FitBounds function for verification
const mockedFitBounds = jest.requireMock('../FitBounds').FitBounds;

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
  MapContainer: ({
    children,
    center,
    zoom,
    className,
    zoomControl,
  }: MapContainerProps & { zoomControl?: boolean }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      className={className}
      data-zoom-control={zoomControl}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: TileLayerProps) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  ZoomControl: ({ position }: { position?: string }) => (
    <div data-testid="zoom-control" data-position={position} />
  ),
  // Mock useMap hook that FitBounds uses
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
}));

describe('Map Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockedFitBounds.mockClear();
  });

  afterEach(() => {
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
    expect(mapContainer).toHaveAttribute('data-zoom', '13');

    // Check if tile layer is rendered
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toBeInTheDocument();
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );
  });

  it('renders the map container with custom props', () => {
    const customCenter: [number, number] = [51.505, -0.09];
    const customZoom = 15;

    render(<Map initialCenter={customCenter} initialZoom={customZoom} className="custom-map" />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-center', JSON.stringify(customCenter));
    expect(mapContainer).toHaveAttribute('data-zoom', customZoom.toString());

    const mapWrapper = mapContainer.parentElement;
    expect(mapWrapper).toHaveClass('custom-map');
  });

  it('renders children components inside the map', () => {
    render(
      <Map>
        <div data-testid="child-component">Test Child</div>
      </Map>
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
    expect(mockedFitBounds).toHaveBeenCalled();
    // The second argument is the React elements props object, which we don't need to test
    expect(mockedFitBounds.mock.calls[0][0]).toEqual({ gpsPoints: testPoints });

    const fitBounds = document.querySelector('[data-testid="fit-bounds"]');
    expect(fitBounds).not.toBeNull();
    expect(fitBounds).toHaveAttribute('data-points', JSON.stringify(testPoints));
  });

  it('does not render FitBounds when no gpsPoints are provided', () => {
    render(<Map />);

    expect(document.querySelector('[data-testid="fit-bounds"]')).toBeNull();
    expect(mockedFitBounds).not.toHaveBeenCalled();
  });

  it('does not render FitBounds when gpsPoints array is empty', () => {
    render(<Map gpsPoints={[]} />);

    // Check that the FitBounds element isn't rendered
    expect(document.querySelector('[data-testid="fit-bounds"]')).toBeNull();

    // FitBounds component shouldn't be called at all because of the condition in Map.tsx:
    // {gpsPoints && gpsPoints.length > 0 && (<FitBounds gpsPoints={gpsPoints} />)}
    expect(mockedFitBounds).not.toHaveBeenCalled();
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
