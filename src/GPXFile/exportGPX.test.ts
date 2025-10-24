import { exportToGPX, downloadGPX, generateGPXFilename, GPXExportOptions } from './exportGPX';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock document.createElement and DOM methods
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

const mockLink = {
  href: '',
  download: '',
  click: mockClick,
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockLink),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('exportToGPX', () => {
  const samplePoints: [number, number][] = [
    [51.505, -0.09],
    [51.506, -0.08],
    [51.507, -0.07],
  ];

  it('should generate valid GPX XML for basic course', () => {
    const gpx = exportToGPX(samplePoints);
    
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<trk>');
    expect(gpx).toContain('<trkseg>');
    expect(gpx).toContain('<trkpt lat="51.505000" lon="-0.090000">');
    expect(gpx).toContain('<trkpt lat="51.506000" lon="-0.080000">');
    expect(gpx).toContain('<trkpt lat="51.507000" lon="-0.070000">');
  });

  it('should include custom name and description', () => {
    const options: GPXExportOptions = {
      name: 'Test Course',
      description: 'A test course for unit testing',
      author: 'Test Author',
    };
    
    const gpx = exportToGPX(samplePoints, options);
    
    expect(gpx).toContain('<name>Test Course</name>');
    expect(gpx).toContain('<desc>A test course for unit testing</desc>');
    expect(gpx).toContain('creator="Test Author"');
  });

  it('should include elevation when requested', () => {
    const options: GPXExportOptions = {
      includeElevation: true,
    };
    
    const gpx = exportToGPX(samplePoints, options);
    
    expect(gpx).toContain('<ele>0</ele>');
  });

  it('should include timestamps when requested', () => {
    const options: GPXExportOptions = {
      includeTimestamps: true,
    };
    
    const gpx = exportToGPX(samplePoints, options);
    
    expect(gpx).toContain('<time>');
    expect(gpx).toMatch(/<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z<\/time>/);
  });

  it('should escape XML special characters in name and description', () => {
    const options: GPXExportOptions = {
      name: 'Test & Course <with> "special" characters',
      description: 'Description with & < > " \' characters',
    };
    
    const gpx = exportToGPX(samplePoints, options);
    
    expect(gpx).toContain('<name>Test &amp; Course &lt;with&gt; &quot;special&quot; characters</name>');
    expect(gpx).toContain('<desc>Description with &amp; &lt; &gt; &quot; &#39; characters</desc>');
  });

  it('should throw error for empty course', () => {
    expect(() => exportToGPX([])).toThrow('Cannot export empty course');
  });

  it('should use default values when no options provided', () => {
    const gpx = exportToGPX(samplePoints);
    
    expect(gpx).toContain('<name>Course</name>');
    expect(gpx).toContain('<desc>Exported course from Crash Course Simulator</desc>');
    expect(gpx).toContain('creator="Crash Course Simulator"');
    expect(gpx).not.toContain('<ele>');
    // Note: metadata timestamp is always included, but track point timestamps are not
    expect(gpx).not.toMatch(/<trkpt[^>]*>[\s\S]*?<time>/);
  });
});

describe('downloadGPX', () => {
  const samplePoints: [number, number][] = [
    [51.505, -0.09],
    [51.506, -0.08],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  it('should create and download GPX file', () => {
    downloadGPX(samplePoints, 'test.gpx');
    
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe('test.gpx');
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should add .gpx extension if not provided', () => {
    downloadGPX(samplePoints, 'test');
    
    expect(mockLink.download).toBe('test.gpx');
  });

  it('should use default filename if not provided', () => {
    downloadGPX(samplePoints);
    
    expect(mockLink.download).toMatch(/^course_\d{4}-\d{2}-\d{2}\.gpx$/);
  });

  it('should pass export options to exportToGPX', () => {
    const options: GPXExportOptions = {
      name: 'Test Course',
      includeElevation: true,
    };
    
    downloadGPX(samplePoints, 'test.gpx', options);
    
    const blob = mockCreateObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/gpx+xml');
  });

  it('should throw error for empty course', () => {
    // Suppress console.error for this test since it's expected
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => downloadGPX([])).toThrow('Cannot export empty course');
    
    consoleSpy.mockRestore();
  });
});

describe('generateGPXFilename', () => {
  let originalDate: DateConstructor;

  beforeEach(() => {
    // Store original Date constructor
    originalDate = global.Date;
    
    // Mock Date constructor to return a fixed date
    global.Date = jest.fn(() => new originalDate('2024-01-15T12:00:00Z')) as any;
    global.Date.now = jest.fn(() => new originalDate('2024-01-15T12:00:00Z').getTime());
  });

  afterEach(() => {
    // Restore original Date constructor
    global.Date = originalDate;
  });

  it('should generate filename with course name and date', () => {
    const filename = generateGPXFilename('My Test Course');
    
    expect(filename).toBe('my_test_course_2024-01-15.gpx');
  });

  it('should clean course name for filename', () => {
    const filename = generateGPXFilename('My Test Course!@#$%^&*()');
    
    expect(filename).toBe('my_test_course_2024-01-15.gpx');
  });

  it('should replace spaces with underscores', () => {
    const filename = generateGPXFilename('My Test Course With Spaces');
    
    expect(filename).toBe('my_test_course_with_spaces_2024-01-15.gpx');
  });

  it('should convert to lowercase', () => {
    const filename = generateGPXFilename('MY TEST COURSE');
    
    expect(filename).toBe('my_test_course_2024-01-15.gpx');
  });

  it('should generate default filename when no course name provided', () => {
    const filename = generateGPXFilename();
    
    expect(filename).toBe('course_2024-01-15.gpx');
  });

  it('should handle empty course name', () => {
    const filename = generateGPXFilename('');
    
    expect(filename).toBe('course_2024-01-15.gpx');
  });

  it('should handle course name with only special characters', () => {
    const filename = generateGPXFilename('!@#$%^&*()');
    
    expect(filename).toBe('course_2024-01-15.gpx');
  });
});
