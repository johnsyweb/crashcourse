import { render, screen, fireEvent, act } from '@testing-library/react';
import ElapsedTime from './ElapsedTime';
import '@testing-library/jest-dom';

describe('ElapsedTime Component', () => {
  it('renders elapsed time correctly', () => {
    render(<ElapsedTime />);
    expect(screen.getByText(/Elapsed Time: 0m 0s/i)).toBeInTheDocument();
  });

  it('starts and updates elapsed time', () => {
    jest.useFakeTimers();
    render(<ElapsedTime />);

    const startButton = screen.getByRole('button', { name: /start timer/i });
    fireEvent.click(startButton);

    // Wrap timer updates in act()
    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    expect(screen.getByText(/Elapsed Time: 0m 3s/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('stops elapsed time', () => {
    jest.useFakeTimers();
    render(<ElapsedTime />);

    const startButton = screen.getByRole('button', { name: /start timer/i });
    const stopButton = screen.getByRole('button', { name: /stop timer/i });

    fireEvent.click(startButton);

    // Wrap timer updates in act()
    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    fireEvent.click(stopButton);

    // Wrap timer updates in act()
    act(() => {
      jest.advanceTimersByTime(2000); // Advance 2 more seconds
    });

    expect(screen.getByText(/Elapsed Time: 0m 3s/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('resets elapsed time', () => {
    jest.useFakeTimers();
    render(<ElapsedTime />);

    const startButton = screen.getByRole('button', { name: /start timer/i });
    const resetButton = screen.getByRole('button', { name: /reset timer/i });

    fireEvent.click(startButton);

    // Wrap timer updates in act()
    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    fireEvent.click(resetButton);

    expect(screen.getByText(/Elapsed Time: 0m 0s/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('starts timer with keyboard shortcut "p"', () => {
    jest.useFakeTimers();
    render(<ElapsedTime />);

    // Simulate pressing 'p' key
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    expect(screen.getByText(/Elapsed Time: 0m 3s/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('stops timer with keyboard shortcut "s"', () => {
    jest.useFakeTimers();
    render(<ElapsedTime />);

    // Start and then stop using keyboard shortcuts
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    fireEvent.keyDown(document, { key: 's' });

    act(() => {
      jest.advanceTimersByTime(2000); // Advance 2 more seconds
    });

    // Time should still be 3s after stopping
    expect(screen.getByText(/Elapsed Time: 0m 3s/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('resets timer with keyboard shortcut "r"', () => {
    jest.useFakeTimers();
    render(<ElapsedTime />);

    // Start and then reset using keyboard shortcuts
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    fireEvent.keyDown(document, { key: 'r' });

    // Time should be reset to 0
    expect(screen.getByText(/Elapsed Time: 0m 0s/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('initializes with initialElapsedTime prop', () => {
    render(<ElapsedTime initialElapsedTime={5} />);
    expect(screen.getByText(/Elapsed Time: 0m 5s/i)).toBeInTheDocument();
  });

  it('calls onElapsedTimeChange callback when time changes', () => {
    jest.useFakeTimers();
    const mockCallback = jest.fn();
    render(<ElapsedTime onElapsedTimeChange={mockCallback} />);

    const startButton = screen.getByRole('button', { name: /start timer/i });
    fireEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(1000); // Advance 1 second
    });

    expect(mockCallback).toHaveBeenCalledWith(1);

    jest.useRealTimers();
  });

  it('does not call callback multiple times for same time value', () => {
    const mockCallback = jest.fn();
    render(<ElapsedTime onElapsedTimeChange={mockCallback} />);

    const resetButton = screen.getByRole('button', { name: /reset timer/i });
    // Reset multiple times (same value of 0)
    fireEvent.click(resetButton);
    fireEvent.click(resetButton);

    // Callback should only be called once since time didn't change
    expect(mockCallback).toHaveBeenCalledTimes(0);
  });

  it('always resets to 0, ignoring initialElapsedTime', () => {
    jest.useFakeTimers();
    const mockCallback = jest.fn();
    render(
      <ElapsedTime
        initialElapsedTime={10}
        onElapsedTimeChange={mockCallback}
      />,
    );

    const startButton = screen.getByRole('button', { name: /start timer/i });
    fireEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(2000); // Advance 2 seconds
    });

    const resetButton = screen.getByRole('button', { name: /reset timer/i });
    fireEvent.click(resetButton);

    expect(screen.getByText(/Elapsed Time: 0m 0s/i)).toBeInTheDocument();
    expect(mockCallback).toHaveBeenCalledWith(0);

    jest.useRealTimers();
  });
});
