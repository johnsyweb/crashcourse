import { render, screen, fireEvent, act } from '@testing-library/react';
import CourseSimulation from './CourseSimulation';
import { Course } from '../Course';
import { Participant } from '../Participant/Participant';
import '@testing-library/jest-dom';

// Mock the Course class
const mockGetPositionAtDistance = jest.fn();
const mockGetWidthAt = jest.fn();
const mockGetCourseWidthInfo = jest.fn();

jest.mock('../Course', () => ({
  Course: jest.fn().mockImplementation(() => ({
    length: 5000,
    startPoint: [10, 20],
    getPositionAtDistance: mockGetPositionAtDistance.mockImplementation((distance: number) => {
      if (distance <= 0) return [10, 20];
      if (distance >= 5000) return [12, 22];
      const ratio = distance / 5000;
      return [10 + (12 - 10) * ratio, 20 + (22 - 20) * ratio];
    }),
    getWidthAt: mockGetWidthAt.mockReturnValue(2),
    getCourseWidthInfo: mockGetCourseWidthInfo.mockReturnValue({
      narrowestWidth: 2,
      widestWidth: 4,
      narrowestPoint: [10, 20],
      widestPoint: [12, 22],
    }),
  })),
}));

// Mock the Participant class
jest.mock('../Participant/Participant', () => ({
  Participant: jest.fn().mockImplementation((course, elapsedTime = 0, pace = '4:00') => ({
    getPosition: () => course.startPoint,
    getProperties: () => ({
      pace,
      elapsedTime,
      cumulativeDistance: 0,
      totalDistance: course.length,
    }),
    updateElapsedTime: jest.fn(),
    reset: jest.fn(),
    move: jest.fn(),
  })),
}));

// Mock child components
jest.mock('../Map', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <div data-testid="mock-map">{children}</div>),
}));

jest.mock('../Course/CourseDisplay', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-course-display" />),
}));

jest.mock('../Participant/ParticipantDisplay', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-participant-display" />),
}));

jest.mock('../Simulator', () => ({
  __esModule: true,
  default: jest.fn(({ onParticipantUpdate, onParticipantCountChange, onPaceRangeChange }) => (
    <div data-testid="mock-simulator">
      <button
        data-testid="update-participants-button"
        onClick={() => onParticipantUpdate([{ id: 'mock-participant' }])}
      >
        Update Participants
      </button>
      <button
        data-testid="change-participant-count-button"
        onClick={() => onParticipantCountChange && onParticipantCountChange(5)}
      >
        Change Participant Count
      </button>
      <button
        data-testid="change-pace-range-button"
        onClick={() => onPaceRangeChange && onPaceRangeChange('10:00', '3:30')}
      >
        Change Pace Range
      </button>
    </div>
  )),
}));

describe('CourseSimulation', () => {
  const mockCoursePoints = [
    [10, 20],
    [11, 21],
    [12, 22],
  ] as [number, number][];
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPositionAtDistance.mockClear();
    mockGetWidthAt.mockClear();
    mockGetCourseWidthInfo.mockClear();
  });

  it('should render without crashing', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    expect(screen.getByText(/Course Simulation/i)).toBeInTheDocument();
  });

  it('should create a Course from the provided course points', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    expect(Course).toHaveBeenCalledWith(mockCoursePoints);
  });

  it('should create two Participants by default when course is created', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    expect(Participant).toHaveBeenCalledTimes(2);
  });

  it('should show error message when course creation fails', () => {
    ((Course as unknown) as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Course creation failed');
    });
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    expect(screen.getByText('Course creation failed')).toBeInTheDocument();
  });

  it('should update participants when simulator triggers update', () => {
    const { rerender } = render(
      <CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />
    );

    act(() => {
      screen.getByTestId('update-participants-button').click();
    });

    rerender(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    expect(screen.getAllByTestId('mock-participant-display')).toHaveLength(1);
  });

  it('should recreate participants when participant count changes', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    (Participant as jest.Mock).mockClear();

    act(() => {
      screen.getByTestId('change-participant-count-button').click();
    });

    expect(Participant).toHaveBeenCalledTimes(5);
  });

  it('should recreate participants when pace range changes', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    (Participant as jest.Mock).mockClear();

    act(() => {
      screen.getByTestId('change-pace-range-button').click();
    });

    expect(Participant).toHaveBeenCalledTimes(2);
  });

  it('should call onReset when reset button is clicked', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    fireEvent.click(screen.getByText(/Import Different Course/i));
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });
});
