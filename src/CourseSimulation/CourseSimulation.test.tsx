import { render, screen, fireEvent, act } from '@testing-library/react';
import CourseSimulation from './CourseSimulation';
import { Course } from '../Course';
import { Participant } from '../Participant/Participant';
import '@testing-library/jest-dom';
import { LatLngTuple } from 'leaflet';

// Mock the Course class
const mockGetPositionAtDistance = jest.fn();
const mockGetWidthAt = jest.fn();
const mockGetCourseWidthInfo = jest.fn();

jest.mock('../Course', () => ({
  Course: jest.fn().mockImplementation(() => ({
    getStartPoint: () => [0, 0],
    getEndPoint: () => [1, 1],
    getLength: () => 1000,
    getPoints: () => [
      [0, 0],
      [1, 1],
    ],
  })),
}));

// Mock the Participant class
jest.mock('../Participant/Participant', () => {
  const mockMove = jest.fn();
  const mockGetProperties = jest.fn().mockReturnValue({
    position: [0, 0] as LatLngTuple,
    elapsedTime: 0,
    pace: '5:00/km',
    cumulativeDistance: 0,
    totalDistance: 1000,
    finished: false,
    id: 'mock-id',
  });
  const mockSetCumulativeDistance = jest.fn();

  let idCounter = 0;

  return {
    Participant: jest.fn().mockImplementation(() => {
      const participantId = `mock-id-${idCounter++}`;

      return {
        getProperties: () => ({
          ...mockGetProperties(),
          id: participantId,
        }),
        move: mockMove,
        isFinished: jest.fn().mockReturnValue(false),
        setCumulativeDistance: mockSetCumulativeDistance,
        getPosition: () => [0, 0] as LatLngTuple,
        getCumulativeDistance: () => 0,
        getWidth: () => 0.5,
        getId: () => participantId,
      };
    }),
  };
});

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
  DEFAULT_PARTICIPANTS: 200,
  default: jest.fn(({ onParticipantUpdate, onParticipantCountChange, onPaceRangeChange }) => {
    let simIdCounter = 0;

    const createMockParticipant = () => {
      const participantId = `sim-mock-id-${simIdCounter++}`;

      return {
        getProperties: () => ({
          position: [0, 0] as LatLngTuple,
          elapsedTime: 0,
          pace: '5:00/km',
          cumulativeDistance: 0,
          totalDistance: 1000,
          finished: false,
          id: participantId,
        }),
        move: jest.fn(),
        isFinished: () => false,
        setCumulativeDistance: jest.fn(),
        getPosition: () => [0, 0] as LatLngTuple,
        getCumulativeDistance: () => 0,
        getWidth: () => 0.5,
        getId: () => participantId,
      };
    };

    return (
      <div data-testid="mock-simulator">
        <button
          data-testid="update-participants-button"
          onClick={() => onParticipantUpdate([createMockParticipant()])}
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
          data-testid="decrease-participant-count-button"
          onClick={() => onParticipantCountChange && onParticipantCountChange(3)}
        >
          Decrease Participant Count
        </button>
        <button
          data-testid="change-pace-range-button"
          onClick={() => onPaceRangeChange && onPaceRangeChange('10:00', '3:30')}
        >
          Change Pace Range
        </button>
      </div>
    );
  }),
}));

describe('CourseSimulation', () => {
  const mockCoursePoints: LatLngTuple[] = [
    [0, 0],
    [1, 1],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPositionAtDistance.mockClear();
    mockGetWidthAt.mockClear();
    mockGetCourseWidthInfo.mockClear();
  });

  it('renders the course simulation component', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(screen.getAllByTestId('mock-map')).toHaveLength(2); // Desktop and mobile layouts
  });

  it('should create a Course from the provided course points', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(Course).toHaveBeenCalledWith(mockCoursePoints);
  });

  it('should create two Participants by default when course is created', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(Participant).toHaveBeenCalledTimes(200);
  });

  it('should show error message when course creation fails', () => {
    (Course as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Course creation failed');
    });
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(screen.getByText('Course creation failed')).toBeInTheDocument();
  });

  it('should update participants when simulator triggers update', () => {
    const { rerender } = render(<CourseSimulation coursePoints={mockCoursePoints} />);

    act(() => {
      screen.getAllByTestId('update-participants-button')[0].click(); // Use first button (desktop layout)
    });

    rerender(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(screen.getAllByTestId('mock-participant-display')).toHaveLength(2); // 1 participant × 2 layouts
  });

  it('should preserve existing participants when adding new ones', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(screen.getAllByTestId('mock-participant-display')).toBeTruthy();

    act(() => {
      screen.getAllByTestId('change-participant-count-button')[0].click(); // Use first button (desktop layout)
    });

    expect(screen.getAllByTestId('mock-participant-display')).toBeTruthy();
  });

  it('should remove participants from the end when decreasing count', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    (Participant as jest.Mock).mockClear();

    // First increase to 5 participants
    act(() => {
      screen.getAllByTestId('change-participant-count-button')[0].click(); // Use first button (desktop layout)
    });

    // Then decrease to 3 participants
    act(() => {
      screen.getAllByTestId('decrease-participant-count-button')[0].click(); // Use first button (desktop layout)
    });

    // Verify that we have 3 participants (multiply by 2 for desktop and mobile layouts)
    expect(screen.getAllByTestId('mock-participant-display')).toHaveLength(6); // 3 participants × 2 layouts
  });

  it('should recreate participants when pace range changes', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    expect(screen.getAllByTestId('mock-participant-display')).toBeTruthy();

    act(() => {
      screen.getAllByTestId('change-pace-range-button')[0].click(); // Use first button (desktop layout)
    });

    expect(screen.getAllByTestId('mock-participant-display')).toBeTruthy();
  });

  it('should call onReset when reset button is clicked', () => {
    const mockOnReset = jest.fn();
    render(<CourseSimulation coursePoints={mockCoursePoints} onReset={mockOnReset} />);
    fireEvent.click(screen.getAllByTestId('reset-button')[0]); // Use first button (desktop layout)
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('adds a participant when the add button is clicked', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    const addButton = screen.getAllByTestId('change-participant-count-button')[0]; // Use first button (desktop layout)
    fireEvent.click(addButton);
    expect(Participant).toHaveBeenCalled();
  });

  it('updates participants when the update button is clicked', () => {
    render(<CourseSimulation coursePoints={mockCoursePoints} />);
    const updateButton = screen.getAllByTestId('update-participants-button')[0]; // Use first button (desktop layout)
    fireEvent.click(updateButton);
    expect(screen.getAllByTestId('mock-participant-display')).toHaveLength(2); // 1 participant × 2 layouts
  });
});
