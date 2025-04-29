import { render, screen, act } from '@testing-library/react';
import CourseSimulationApp from './CourseSimulationApp';
import CourseDataImporter from '../CourseDataImporter';
import CourseSimulation from '../CourseSimulation';

// Mock the dependent components
jest.mock('../CourseDataImporter', () => ({
  __esModule: true,
  default: jest.fn(({ onCourseDataImported }) => (
    <div data-testid="mock-course-data-importer">
      <button
        data-testid="import-button"
        onClick={() =>
          onCourseDataImported([
            [1, 2],
            [3, 4],
          ])
        }
      >
        Import Data
      </button>
    </div>
  )),
}));

jest.mock('../CourseSimulation', () => ({
  __esModule: true,
  default: jest.fn(({ onReset }) => (
    <div data-testid="mock-course-simulation">
      <button data-testid="reset-button" onClick={onReset}>
        Reset
      </button>
    </div>
  )),
}));

describe('CourseSimulationApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CourseDataImporter when no course points are provided', () => {
    render(<CourseSimulationApp />);

    expect(screen.getByTestId('mock-course-data-importer')).toBeInTheDocument();
    expect(CourseDataImporter).toHaveBeenCalled();
    expect(CourseSimulation).not.toHaveBeenCalled();
  });

  it('renders CourseSimulation when course data is imported', () => {
    const { rerender } = render(<CourseSimulationApp />);

    // Simulate importing course data using act
    act(() => {
      screen.getByTestId('import-button').click();
    });

    rerender(<CourseSimulationApp />);

    expect(screen.getByTestId('mock-course-simulation')).toBeInTheDocument();
    expect(CourseSimulation).toHaveBeenCalled();

    // Verify correct props were passed to CourseSimulation
    const simulationProps = (CourseSimulation as jest.Mock).mock.calls[0][0];
    expect(simulationProps.coursePoints).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(typeof simulationProps.onReset).toBe('function');
  });

  it('resets back to CourseDataImporter when reset is called', () => {
    const { rerender } = render(<CourseSimulationApp />);

    // First import course data
    act(() => {
      screen.getByTestId('import-button').click();
    });

    rerender(<CourseSimulationApp />);
    expect(screen.getByTestId('mock-course-simulation')).toBeInTheDocument();

    // Now call the reset function
    act(() => {
      screen.getByTestId('reset-button').click();
    });

    rerender(<CourseSimulationApp />);

    expect(screen.getByTestId('mock-course-data-importer')).toBeInTheDocument();
  });
});
