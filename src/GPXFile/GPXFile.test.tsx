import { render, screen, waitFor } from '@testing-library/react';
import GPXFile, { GPXData } from './GPXFile';
import '@testing-library/jest-dom';

// Mock File object for testing
const createFileMock = (content: string, name: string = 'test.gpx') => {
  const blob = new Blob([content], { type: 'application/gpx+xml' });
  return new File([blob], name, { type: 'application/gpx+xml' });
};

// Sample GPX data for testing with correct name tags
const validGPXContent = `
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="38.857101" lon="-77.051">
        <ele>100</ele>
        <time>2023-01-01T10:00:00Z</time>
      </trkpt>
      <trkpt lat="38.857102" lon="-77.052">
        <ele>101</ele>
        <time>2023-01-01T10:01:00Z</time>
      </trkpt>
      <trkpt lat="38.857103" lon="-77.053">
        <ele>102</ele>
        <time>2023-01-01T10:02:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
`;

const invalidGPXContent = `
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <metadata>
    <name>Invalid GPX</name>
  </metadata>
</gpx>
`;

describe('GPXFile Component', () => {
  // Mock console methods to prevent pollution
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(() => {
    // Silence console logs during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore console methods after tests
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  // Mock implementation of readFileAsText using Jest's mocking
  beforeEach(() => {
    // Create a custom mock of FileReader
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: class MockFileReader extends FileReader {
        onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

        readAsText(file: Blob) {
          setTimeout(() => {
            if (this.onload) {
              // Determine content based on file name to test different scenarios
              const fileObject = file as File;
              const content = fileObject.name.includes('invalid')
                ? invalidGPXContent
                : validGPXContent;

              // Mock the result
              const mockEvent = {
                target: {
                  result: content,
                },
              } as unknown as ProgressEvent<FileReader>;

              this.onload(mockEvent);
            }
          }, 10);
        }
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Reset the mock state of console methods
    jest.clearAllMocks();
  });

  it('parses valid GPX file successfully', async () => {
    const mockFile = createFileMock(validGPXContent);
    const onDataParsed = jest.fn();

    render(<GPXFile file={mockFile} onDataParsed={onDataParsed} />);

    // Wait for the parsing to complete
    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
    });

    // Check that the parsed data is correct
    const data: GPXData = onDataParsed.mock.calls[0][0];
    expect(data.isValid).toBe(true);
    expect(data.points.length).toBe(3);
    expect(data.name).toBe('Test Track');
    expect(data.startPoint).toEqual({
      lat: 38.857101,
      lon: -77.051,
      ele: 100,
      time: '2023-01-01T10:00:00Z',
    });
  });

  it('handles invalid GPX file', async () => {
    const mockFile = createFileMock(invalidGPXContent, 'invalid.gpx');
    const onDataParsed = jest.fn();

    render(<GPXFile file={mockFile} onDataParsed={onDataParsed} />);

    // Wait for the parsing to complete
    await waitFor(() => {
      expect(onDataParsed).toHaveBeenCalled();
    });

    // Check that the error is handled correctly
    const data: GPXData = onDataParsed.mock.calls[0][0];
    expect(data.isValid).toBe(false);
    expect(data.errorMessage).toBeDefined();

    // The error message should be displayed to the user
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('displays loading state while parsing', async () => {
    const mockFile = createFileMock(validGPXContent);
    const onDataParsed = jest.fn();

    // Override FileReader for this test to make it slower
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: class SlowMockFileReader {
        onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;

        readAsText() {
          // Don't call onload to keep the loading state visible
        }
      },
    });

    render(<GPXFile file={mockFile} onDataParsed={onDataParsed} />);

    // The loading indicator should be displayed
    expect(screen.getByText(/Parsing GPX file/i)).toBeInTheDocument();
  });
});
