import { render, waitFor } from '@testing-library/react';
import KMLFile, { KMLData } from './KMLFile';
import readKMLContent from './readKMLContent';

jest.mock('./readKMLContent', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const validKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Test Event</name>
    <Placemark>
      <LineString>
        <coordinates>144.71,-36.92,0 144.72,-36.93,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

describe('KMLFile Component', () => {
  const readKMLContentMock = readKMLContent as jest.MockedFunction<typeof readKMLContent>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses valid KML file successfully', async () => {
    readKMLContentMock.mockResolvedValue(validKml);
    const mockFile = new File([validKml], 'course.kml', {
      type: 'application/vnd.google-earth.kml+xml',
    });
    const onDataParsed = jest.fn();

    render(<KMLFile file={mockFile} onDataParsed={onDataParsed} />);

    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
    });

    const data: KMLData = onDataParsed.mock.calls[0][0];
    expect(data.isValid).toBe(true);
    expect(data.name).toBe('Test Event');
    expect(data.points).toHaveLength(2);
  });

  it('handles invalid KML file', async () => {
    readKMLContentMock.mockResolvedValue('<kml></kml>');
    const mockFile = new File(['<kml></kml>'], 'invalid.kml', {
      type: 'application/vnd.google-earth.kml+xml',
    });
    const onDataParsed = jest.fn();

    render(<KMLFile file={mockFile} onDataParsed={onDataParsed} />);

    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
    });

    const data: KMLData = onDataParsed.mock.calls[0][0];
    expect(data.isValid).toBe(false);
    expect(data.errorMessage).toBeDefined();
  });
});
