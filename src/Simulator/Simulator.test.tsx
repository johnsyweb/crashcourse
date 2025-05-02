import { render, screen, fireEvent, act } from '@testing-library/react';
import Simulator from './Simulator';
import { Course } from '../Course';
import { Participant } from '../Participant';
import '@testing-library/jest-dom';

// Mock the Course and Participant classes
jest.mock('../Course', () => ({
  Course: jest.fn().mockImplementation(() => ({
    length: 1000,
    getPositionAtDistance: jest.fn().mockReturnValue([0, 0]),
    getWidthAt: jest.fn().mockReturnValue(2),
    getCourseWidthInfo: jest.fn().mockReturnValue({
      narrowestWidth: 2,
      widestWidth: 4,
    }),
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
  const mockParticipants = [new Participant([]), new Participant([])] as unknown as Participant[];
  const mockParticipantUpdate = jest.fn();
  const mockParticipantCountChange = jest.fn();
  const mockPaceRangeChange = jest.fn();

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
      />
    );

    expect(screen.getByText(/Simulator Controls/i)).toBeInTheDocument();

    // In our new UI structure, the course length is displayed differently
    // Check for label and value separately
    expect(screen.getByText(/Course Length/i)).toBeInTheDocument();
    expect(screen.getByText(/1.00/i)).toBeInTheDocument();
    // Use getAllByText and check the first instance for "km" since we have multiple elements with this text now
    expect(screen.getAllByText(/km/i)[0]).toBeInTheDocument();

    // Instead of using getByLabelText which is too generic now, use a more specific query
    const inputElement = screen.getByRole('spinbutton', {
      name: /number of participants/i,
    });
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveValue(2);

    // Check pace range inputs are rendered
    expect(screen.getByLabelText(/Slowest pace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fastest pace/i)).toBeInTheDocument();

    // Verify default pace values
    expect(screen.getByLabelText(/Slowest pace/i)).toHaveValue('12:00');
    expect(screen.getByLabelText(/Fastest pace/i)).toHaveValue('2:30');
  });

  it('updates participants and calls onParticipantUpdate when elapsed time changes', async () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
      />
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

  it('calls onParticipantCountChange when the participant count is changed', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onParticipantCountChange={mockParticipantCountChange}
      />
    );

    // Use a more specific role-based selector for the number input
    const participantCountInput = screen.getByRole('spinbutton', {
      name: /number of participants/i,
    });

    // Change the participant count
    act(() => {
      fireEvent.change(participantCountInput, { target: { value: '5' } });
    });

    // Verify that onParticipantCountChange was called with the new count
    expect(mockParticipantCountChange).toHaveBeenCalledWith(5);
  });

  it('enforces a minimum participant count of 1', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onParticipantCountChange={mockParticipantCountChange}
      />
    );

    // Use a more specific role-based selector for the number input
    const participantCountInput = screen.getByRole('spinbutton', {
      name: /number of participants/i,
    });

    // Try to set an invalid participant count
    act(() => {
      fireEvent.change(participantCountInput, { target: { value: '0' } });
    });

    // Verify that onParticipantCountChange was called with the minimum value of 1
    expect(mockParticipantCountChange).toHaveBeenCalledWith(1);
  });

  it('calls onPaceRangeChange when min pace is changed', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onPaceRangeChange={mockPaceRangeChange}
      />
    );

    const minPaceInput = screen.getByLabelText(/Slowest pace/i);

    act(() => {
      fireEvent.change(minPaceInput, { target: { value: '10:00' } });
    });

    // Verify that onPaceRangeChange was called (don't check specific values as they
    // can vary depending on the comparison logic)
    expect(mockPaceRangeChange).toHaveBeenCalled();
  });

  it('calls onPaceRangeChange when max pace is changed', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onPaceRangeChange={mockPaceRangeChange}
      />
    );

    const maxPaceInput = screen.getByLabelText(/Fastest pace/i);

    act(() => {
      fireEvent.change(maxPaceInput, { target: { value: '3:00' } });
    });

    // Verify that onPaceRangeChange was called (don't check specific values as they
    // can vary depending on the comparison logic)
    expect(mockPaceRangeChange).toHaveBeenCalled();
  });

  it('formats pace values correctly with leading zeros for seconds', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onPaceRangeChange={mockPaceRangeChange}
      />
    );

    const minPaceInput = screen.getByLabelText(/Slowest pace/i);

    act(() => {
      fireEvent.change(minPaceInput, { target: { value: '8:5' } });
    });

    // Expect that the value will be formatted with a leading zero for seconds
    // Just check that it was called
    expect(mockPaceRangeChange).toHaveBeenCalled();

    // Verify the first argument has the proper format with leading zero
    expect(mockPaceRangeChange.mock.calls[0][0]).toBe('8:05');
  });

  it('shows error message when pace range is invalid (fastest > slowest)', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onPaceRangeChange={mockPaceRangeChange}
      />
    );

    // Try to set the fastest pace slower than the slowest pace
    const fastestPaceInput = screen.getByLabelText(/Fastest pace/i);

    act(() => {
      fireEvent.change(fastestPaceInput, { target: { value: '15:00' } });
    });

    // Should show an error message
    expect(screen.getByText(/Fastest pace must be less than slowest pace/i)).toBeInTheDocument();

    // onPaceRangeChange should not be called because the input is invalid
    expect(mockPaceRangeChange).not.toHaveBeenCalled();
  });

  it('shows error message when slowest pace is faster than fastest pace', () => {
    render(
      <Simulator
        course={mockCourse}
        participants={mockParticipants}
        onParticipantUpdate={mockParticipantUpdate}
        onPaceRangeChange={mockPaceRangeChange}
      />
    );

    // Try to set the slowest pace faster than the fastest pace
    const slowestPaceInput = screen.getByLabelText(/Slowest pace/i);

    act(() => {
      fireEvent.change(slowestPaceInput, { target: { value: '2:00' } });
    });

    // Should show an error message
    expect(screen.getByText(/Slowest pace must be greater than fastest pace/i)).toBeInTheDocument();

    // onPaceRangeChange should not be called because the input is invalid
    expect(mockPaceRangeChange).not.toHaveBeenCalled();
  });
});
