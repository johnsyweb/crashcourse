import { render, screen, fireEvent, act } from '@testing-library/react';
import Simulator from './Simulator';
import { Course } from '../Course';
import { Participant } from '../Participant';
import '@testing-library/jest-dom';

// Mock the Course and Participant classes
jest.mock('../Course', () => ({
  Course: jest.fn().mockImplementation((points) => ({
    length: 5000, // 5km course
    points,
  })),
}));

jest.mock('../Participant', () => ({
  Participant: jest.fn().mockImplementation(() => ({
    updateElapsedTime: jest.fn(),
    getPosition: jest.fn().mockReturnValue([0, 0]),
    getProperties: jest.fn().mockReturnValue({}),
  })),
}));

// Mock the ElapsedTime component to directly call onElapsedTimeChange
jest.mock('../ElapsedTime', () => {
  return function MockElapsedTime({
    onElapsedTimeChange,
  }: {
    onElapsedTimeChange?: (time: number) => void;
  }) {
    return (
      <div>
        <p>Mock ElapsedTime</p>
        <button
          data-testid="elapsed-time-control"
          onClick={() => onElapsedTimeChange && onElapsedTimeChange(10)}
        >
          Control Time
        </button>
      </div>
    );
  };
});

describe('Simulator Component', () => {
  const mockCourse = new Course([]) as unknown as Course;
  const mockParticipants = [
    new Participant([]),
    new Participant([]),
  ] as unknown as Participant[];
  const mockParticipantUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Setup fake timers for each test
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
  });

  it('renders simulator controls', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
      />,
    );

    expect(screen.getByText(/Simulator Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Course Length: 5.00 km/i)).toBeInTheDocument();
    expect(screen.getByText(/Participants: 2/i)).toBeInTheDocument();
  });

  it('updates participants and calls onParticipantUpdate when elapsed time changes', async () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
      />,
    );

    // Use our mocked elapsed time control
    const timeControl = screen.getByTestId('elapsed-time-control');

    act(() => {
      fireEvent.click(timeControl);
      // We need to wait for the effect to run
      jest.runAllTimers();
    });

    // Verify that onParticipantUpdate was called
    expect(mockParticipantUpdate).toHaveBeenCalled();

    // Verify that updateElapsedTime was called on all participants
    mockParticipants.forEach((participant) => {
      expect(participant.updateElapsedTime).toHaveBeenCalledWith(10);
    });
  });
});
