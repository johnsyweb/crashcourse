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

// Create a standard mock for GPXFile
const standardGPXMock = jest.fn(({ onDataParsed }) => {
  // Call onDataParsed immediately for testing purposes
  React.useEffect(() => {
    const mockData: GPXData = {
      isValid: true,
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
    render(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />,
    );

    expect(screen.getByText(/Import Course Data/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-file-upload-section')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-gpx-file')).not.toBeInTheDocument();
  });

  it('shows GPXFile component after file is selected', async () => {
    const { rerender } = render(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />,
    );

    // Simulate file selection with act
    act(() => {
      screen.getByTestId('upload-button').click();
    });

    rerender(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />,
    );

    expect(screen.getByTestId('mock-gpx-file')).toBeInTheDocument();
  });

  it('calls onCourseDataImported when valid GPX data is parsed', async () => {
    render(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />,
    );

    // Simulate file selection
    act(() => {
      screen.getByTestId('upload-button').click();
    });

    // Wait for the async GPX parsing to complete
    await waitFor(() => {
      expect(mockOnCourseDataImported).toHaveBeenCalledWith([
        [10, 20],
        [11, 21],
      ]);
    });
  });

  it('shows error message when GPX parsing fails', async () => {
    // Override the mock implementation for this test
    (GPXFile as jest.Mock).mockImplementation(errorGPXMock);

    const { rerender } = render(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />,
    );

    // Reset the mock first
    mockOnCourseDataImported.mockReset();

    // Simulate file selection
    act(() => {
      screen.getByTestId('upload-button').click();
    });

    rerender(
      <CourseDataImporter onCourseDataImported={mockOnCourseDataImported} />,
    );

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid GPX file')).toBeInTheDocument();
    });

    // onCourseDataImported should not be called with invalid data
    expect(mockOnCourseDataImported).not.toHaveBeenCalled();
  });
});
