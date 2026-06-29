import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import CourseDataImporter from './CourseDataImporter';
import GPXFile, { GPXData } from '../GPXFile';

// Mock the dependent components
jest.mock('../FileUploadSection', () => ({
  __esModule: true,
  default: jest.fn(({ handleFileChange }) => (
    <div data-testid="mock-file-upload-section">
      <button
        data-testid="upload-button"
        onClick={() =>
          handleFileChange({
            target: { files: [new File(['content'], 'test.gpx')] },
            currentTarget: { files: [new File(['content'], 'test.gpx')] },
            preventDefault: jest.fn() as jest.Mock,
            stopPropagation: jest.fn() as jest.Mock,
            nativeEvent: new Event('change'),
          } as unknown as React.ChangeEvent<HTMLInputElement>)
        }
      >
        Mock Upload
      </button>
    </div>
  )),
}));

jest.mock('../FITFile', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../KMLFile', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

// Create a standard mock for GPXFile
const standardGPXMock = jest.fn(({ onDataParsed }) => {
  // Call onDataParsed immediately for testing purposes
  React.useEffect(() => {
    const mockData: GPXData = {
      isValid: true,
      name: 'Test Track',
      description: 'Test Description',
      points: [
        { lat: 10, lon: 20, ele: 100 },
        { lat: 11, lon: 21, ele: 110 },
      ],
      errorMessage: undefined,
    };
    onDataParsed(mockData);
  }, [onDataParsed]);

  return <div data-testid="mock-gpx-file" />;
});

// Error mock for GPXFile
const errorGPXMock = jest.fn(({ onDataParsed }) => {
  // Call onDataParsed immediately with error data
  React.useEffect(() => {
    onDataParsed({
      isValid: false,
      points: [],
      errorMessage: 'Invalid GPX file',
    });
  }, [onDataParsed]);

  return <div data-testid="mock-gpx-file-error" />;
});

// Move the jest.mock call after the mock functions are defined
jest.mock('../GPXFile', () => {
  return {
    __esModule: true,
    default: jest.fn(), // This will be implemented in beforeEach
  };
});

describe('CourseDataImporter', () => {
  const mockOnCourseDataImported = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set the implementation in beforeEach
    (GPXFile as jest.Mock).mockImplementation(standardGPXMock);
  });

  it('renders correctly with initial state', () => {
    render(<CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />);

    expect(screen.getByTestId('mock-file-upload-section')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-gpx-file')).not.toBeInTheDocument();
  });

  it('shows GPXFile component after file is selected', async () => {
    const { rerender } = render(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />
    );

    // Simulate file selection with act
    act(() => {
      screen.getByTestId('upload-button').click();
    });

    rerender(<CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />);

    expect(screen.getByTestId('mock-gpx-file')).toBeInTheDocument();
  });

  it('shows course assembly controls after valid GPX data is parsed', async () => {
    render(<CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />);

    act(() => {
      screen.getByTestId('upload-button').click();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Course assembly/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Start assessment/i })).toBeInTheDocument();
    expect(mockOnCourseDataImported).not.toHaveBeenCalled();
  });

  it('calls onCourseDataImported when assessment is started', async () => {
    render(<CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />);

    act(() => {
      screen.getByTestId('upload-button').click();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start assessment/i })).toBeEnabled();
    });

    act(() => {
      screen.getByRole('button', { name: /Start assessment/i }).click();
    });

    await waitFor(() => {
      expect(mockOnCourseDataImported).toHaveBeenCalledWith(
        expect.arrayContaining([expect.arrayContaining([expect.any(Number), expect.any(Number)])]),
        {
          name: 'Test Track',
          description: 'Test Description',
        },
        undefined,
        expect.objectContaining({
          segmentPoints: [
            [10, 20],
            [11, 21],
          ],
          assemblyParams: expect.objectContaining({
            mirror: false,
            targetLengthMeters: expect.any(Number),
          }),
        })
      );
    });
  });

  it('shows error message when GPX parsing fails', async () => {
    // Override the mock implementation for this test
    (GPXFile as jest.Mock).mockImplementation(errorGPXMock);

    const { rerender } = render(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />
    );

    // Reset the mock first
    mockOnCourseDataImported.mockReset();

    // Simulate file selection
    act(() => {
      screen.getByTestId('upload-button').click();
    });

    rerender(<CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid GPX file')).toBeInTheDocument();
    });

    // onCourseDataImported should not be called with invalid data
    expect(mockOnCourseDataImported).not.toHaveBeenCalled();
  });
});
