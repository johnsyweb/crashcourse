import { render, screen, fireEvent, act } from '@testing-library/react';
import CourseSimulation from './CourseSimulation';
import { Course } from '../Course';
import { Participant } from '../Participant/Participant';
import Simulator from '../Simulator';
import { LatLngTuple } from 'leaflet';

// Mock the dependent components and classes
jest.mock('../Course', () => {
  const mockCourse = jest.fn().mockImplementation(() => ({
    // Mock Course properties/methods as needed
  }));

  return {
    __esModule: true,
    Course: mockCourse,
    CourseDisplay: jest.fn(() => <div data-testid="mock-course-display" />),
  };
});

jest.mock('../Participant/Participant', () => {
  const mockParticipant = jest.fn().mockImplementation(() => ({
    // Mock Participant properties/methods as needed
  }));

  return {
    __esModule: true,
    Participant: mockParticipant,
  };
});

jest.mock('../Participant/ParticipantDisplay', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-participant-display" />),
}));

jest.mock('../Map', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => (
    <div data-testid="mock-map">{children}</div>
  )),
}));

// Create a mock updated participants array to use in tests
const mockUpdatedParticipants = [{ id: 'mock-participant' }];

jest.mock('../Simulator', () => ({
  __esModule: true,
  default: jest.fn(({ onParticipantUpdate }) => (
    <div data-testid="mock-simulator">
      <button
        data-testid="update-participants-button"
        onClick={() => onParticipantUpdate(mockUpdatedParticipants)}
      >
        Update Participants
      </button>
    </div>
  )),
}));

describe('CourseSimulation', () => {
  const mockCoursePoints: LatLngTuple[] = [
    [10, 20],
    [11, 21],
    [12, 22],
  ];
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with course points', () => {
    render(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    expect(screen.getByText(/Course Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Different Course/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getByTestId('mock-simulator')).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', () => {
    render(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    fireEvent.click(screen.getByText(/Import Different Course/i));
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('creates a Course from the provided course points', () => {
    render(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    expect(Course).toHaveBeenCalledWith(mockCoursePoints);
  });

  it('creates a Participant when course is created', () => {
    render(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    expect(Participant).toHaveBeenCalledWith(mockCoursePoints);
  });

  it('shows error message when course creation fails', () => {
    // Make Course constructor throw an error for this test
    (Course as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Course creation failed');
    });

    render(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    expect(screen.getByText('Course creation failed')).toBeInTheDocument();
  });

  it('updates participants when simulator triggers update', () => {
    // Render the component
    const { rerender } = render(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    // Get the onParticipantUpdate callback and simulate updating participants
    act(() => {
      screen.getByTestId('update-participants-button').click();
    });

    // Re-render to capture the state update
    rerender(
      <CourseSimulation
        coursePoints={mockCoursePoints}
        onReset={mockOnReset}
      />,
    );

    // The next render should have the updated participants
    const nextCallIndex = (Simulator as jest.Mock).mock.calls.length - 1;
    const updatedSimulatorProps = (Simulator as jest.Mock).mock.calls[
      nextCallIndex
    ][0];

    // Verify that participants were updated to the mock values
    expect(updatedSimulatorProps.participants).toEqual(mockUpdatedParticipants);
  });
});
