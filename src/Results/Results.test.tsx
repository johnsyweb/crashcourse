import { render, screen, fireEvent } from '@testing-library/react';
import Results from './Results';
import { Participant } from '../Participant/Participant';

// Define a type for our mock participant to make TypeScript happy
interface MockParticipant {
  getProperties: jest.Mock;
  getCumulativeDistance: jest.Mock;
}

// Mock the component directly and create a simple jest.fn implementation
jest.mock('../Participant/Participant');

describe('Results Component', () => {
  // Setup mock participants before each test
  let mockParticipants: MockParticipant[];

  beforeEach(() => {
    // Create a mock participant implementation
    const mockParticipant: MockParticipant = {
      getProperties: jest.fn().mockReturnValue({
        elapsedTime: 1200,
        pace: '4:00',
        cumulativeDistance: 5000,
        totalDistance: 5000,
        finished: true,
      }),
      getCumulativeDistance: jest.fn().mockReturnValue(5000),
    };

    // Clear mock implementation from previous tests
    jest.clearAllMocks();

    // Create an array with two mock participants
    mockParticipants = [mockParticipant, mockParticipant];
  });

  it('renders nothing when there are no participants', () => {
    const { container } = render(<Results participants={[]} elapsedTime={0} />);
    expect(container).toHaveTextContent('Will be displayed here');
  });

  it('renders a table with results when participants are provided', () => {
    render(
      <Results participants={mockParticipants as unknown as Participant[]} elapsedTime={1200} />
    );

    // Check if table headers are rendered
    expect(screen.getByText(/Position/)).toBeInTheDocument();
    expect(screen.getByText(/Time/)).toBeInTheDocument();
    expect(screen.getAllByText(/Pace/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Target Pace/)).toBeInTheDocument();
    expect(screen.getByText(/Delta/)).toBeInTheDocument();
    expect(screen.getByText(/Sentiment/)).toBeInTheDocument();
  });

  it('displays reset button when onReset prop is provided', () => {
    const mockReset = jest.fn();
    render(
      <Results
        participants={mockParticipants as unknown as Participant[]}
        elapsedTime={1200}
        onReset={mockReset}
      />
    );

    const resetButton = screen.getByText('Reset Results');
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(mockReset).toHaveBeenCalled();
  });

  it('allows sorting when clicking column headers', () => {
    render(
      <Results participants={mockParticipants as unknown as Participant[]} elapsedTime={1200} />
    );

    const positionHeader = screen.getByText(/Time/);
    fireEvent.click(positionHeader);

    expect(positionHeader.textContent).toContain('Time ↑');

    fireEvent.click(positionHeader);
    expect(positionHeader.textContent).toContain('Time ↓');
  });
});
