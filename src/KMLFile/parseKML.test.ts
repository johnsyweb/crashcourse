import JSZip from 'jszip';
import { parseCoordinatesString, parseKMLContent, stripHtml } from './parseKML';

const minimalKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Test Event</name>
    <description>Out and back course</description>
    <Placemark>
      <name>Route</name>
      <description><![CDATA[Distance: 2.5 km<br>Minimum Elevation: 237 m]]></description>
      <LineString>
        <coordinates>144.71,-36.92,0 144.72,-36.93,0 144.73,-36.94,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

describe('stripHtml', () => {
  it('removes HTML tags and normalises whitespace', () => {
    expect(stripHtml('Distance: 2.5 km<br>Minimum Elevation: 237 m')).toBe(
      'Distance: 2.5 km Minimum Elevation: 237 m'
    );
  });
});

describe('parseCoordinatesString', () => {
  it('parses lon,lat,alt tuples into lat/lon points', () => {
    expect(parseCoordinatesString('144.71,-36.92,0 144.72,-36.93,0')).toEqual([
      { lat: -36.92, lon: 144.71, ele: 0 },
      { lat: -36.93, lon: 144.72, ele: 0 },
    ]);
  });
});

describe('parseKMLContent', () => {
  it('extracts document metadata and course path from a minimal KML file', () => {
    const result = parseKMLContent(minimalKml);

    expect(result.name).toBe('Test Event');
    expect(result.description).toBe(
      'Out and back course\n\nDistance: 2.5 km Minimum Elevation: 237 m'
    );
    expect(result.points).toHaveLength(3);
    expect(result.points[0]).toEqual({ lat: -36.92, lon: 144.71, ele: 0 });
    expect(result.warning).toBeUndefined();
  });

  it('throws when no LineString is present', () => {
    const markersOnly = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Markers only</name>
    <Placemark>
      <Point>
        <coordinates>144.71,-36.92,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    expect(() => parseKMLContent(markersOnly)).toThrow(
      'No course path found in KML file. Draw a route line in Google Maps and export again.'
    );
  });

  it('uses the longest LineString and returns a warning when multiple routes exist', () => {
    const multipleRoutes = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Multiple routes</name>
    <Placemark>
      <LineString>
        <coordinates>144.70,-36.90,0 144.71,-36.91,0</coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <LineString>
        <coordinates>144.80,-36.80,0 144.81,-36.81,0 144.82,-36.82,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

    const result = parseKMLContent(multipleRoutes);

    expect(result.warning).toBe('Multiple routes found; using the longest.');
    expect(result.points).toHaveLength(3);
    expect(result.points[0]).toEqual({ lat: -36.8, lon: 144.8, ele: 0 });
  });

  it('throws when the selected path has fewer than two points', () => {
    const singlePointPath = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>144.71,-36.92,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

    expect(() => parseKMLContent(singlePointPath)).toThrow(
      'Invalid course data: course path must contain at least 2 GPS points.'
    );
  });

  it('throws when XML is not a valid KML document', () => {
    expect(() => parseKMLContent('<kml></kml>')).toThrow(
      'Invalid KML format: missing Document element.'
    );
  });
});

describe('readKMLContent integration', () => {
  it('extracts KML text from a KMZ archive', async () => {
    const zip = new JSZip();
    zip.file('doc.kml', minimalKml);
    const kmzBlob = await zip.generateAsync({ type: 'blob' });
    const kmzFile = new File([kmzBlob], 'course.kmz', { type: 'application/vnd.google-earth.kmz' });

    const readKMLContent = (await import('./readKMLContent')).default;
    const content = await readKMLContent(kmzFile);

    expect(content).toContain('<name>Test Event</name>');
  });
});
