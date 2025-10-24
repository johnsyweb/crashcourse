const React = require('react');

// Suppress the punycode deprecation warning
const originalWarn = process.emitWarning;
process.emitWarning = (...args) => {
  if (args[2] && args[2].code === 'DEP0040') return;
  return originalWarn.apply(process, args);
};

// Suppress the experimental ES Module warning
const originalEmit = process.emit;
process.emit = function (event, ...args) {
  if (event === 'warning' && args[0] && args[0].name === 'ExperimentalWarning') return;
  return originalEmit.apply(process, [event, ...args]);
};

// Mock react-leaflet for testing
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'map-container' }, children);
  },
  TileLayer: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tile-layer' });
  },
  Marker: ({ children, position }) => {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-testid': 'marker',
        'data-position': JSON.stringify(position),
      },
      children
    );
  },
  Popup: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'popup' }, children);
  },
  useMap: () => ({
    setView: jest.fn(),
    fitBounds: jest.fn(),
  }),
  useMapEvent: jest.fn(),
  useMapEvents: jest.fn(),
}));

// Mock leaflet
jest.mock('leaflet', () => ({
  divIcon: jest.fn(() => ({})),
  icon: jest.fn(() => ({})),
  LatLngBounds: jest.fn().mockImplementation(() => ({
    extend: jest.fn(),
    isValid: jest.fn(() => true),
  })),
}));
