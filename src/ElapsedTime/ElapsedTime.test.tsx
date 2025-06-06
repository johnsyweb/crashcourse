import { render, screen, fireEvent, act } from '@testing-library/react';
import ElapsedTime from './ElapsedTime';
import '@testing-library/jest-dom';

describe('ElapsedTime Component', () => {
  // Reset timers before each test
  beforeEach(() => {
    jest.useFakeTimers();
  });

  // Restore timers after each test
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders elapsed time correctly', () => {
    render(<ElapsedTime />);
    // In our new UI, the time display doesn't include the "Elapsed Time:" text
    // Just check for the time values themselves
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('starts and updates elapsed time', () => {
    const { rerender } = render(<ElapsedTime />);

    // Set a fixed speed for consistent testing
    const speedSelect = screen.getByRole('combobox');
    fireEvent.change(speedSelect, { target: { value: '60' } });

    const startButton = screen.getByRole('button', { name: /Start timer/i });
    fireEvent.click(startButton);

    // At 60x speed, we need much less real time to advance the simulation time
    act(() => {
      jest.advanceTimersByTime(50); // Should be enough for 3 seconds at 60x speed
    });

    // Force a rerender to ensure the component updates
    rerender(<ElapsedTime />);

    // Check that the elapsed time is no longer 0
    expect(screen.queryByText('00:00:00')).not.toBeInTheDocument();

    // Reset the timer to have a predictable state for other tests
    const resetButton = screen.getByRole('button', { name: /Reset timer/i });
    fireEvent.click(resetButton);
  });

  it('stops elapsed time', () => {
    render(<ElapsedTime />);

    const speedSelect = screen.getByRole('combobox');
    fireEvent.change(speedSelect, { target: { value: '60' } });

    const playPauseButton = screen.getByRole('button', { name: /Start timer/i });

    // Start the timer
    fireEvent.click(playPauseButton);

    act(() => {
      jest.advanceTimersByTime(1000); // Advance 1 second (at 60x speed)
    });

    // The button should now be a pause button
    expect(screen.getByRole('button', { name: /Pause timer/i })).toBeInTheDocument();

    // Click to pause
    fireEvent.click(screen.getByRole('button', { name: /Pause timer/i }));

    // Get the current displayed time text for verification
    const timeDisplayText = screen.getByText(/\d{2}:\d{2}:\d{2}/i).textContent || '';

    // Advance more time, but timer should be stopped
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Time should not have changed
    expect(screen.getByText(timeDisplayText)).toBeInTheDocument();
  });

  it('resets elapsed time', () => {
    const { rerender } = render(<ElapsedTime />);

    // Set a fixed speed for consistent testing
    const speedSelect = screen.getByRole('combobox');
    fireEvent.change(speedSelect, { target: { value: '60' } });

    const startButton = screen.getByRole('button', { name: /Start timer/i });
    const resetButton = screen.getByRole('button', { name: /Reset timer/i });

    fireEvent.click(startButton);

    // Advance enough time to make sure the time has increased
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Force a rerender to ensure the component updates
    rerender(<ElapsedTime />);

    // Verify that time has advanced (is no longer 0)
    expect(screen.queryByText('00:00:00')).not.toBeInTheDocument();

    // Reset the timer
    fireEvent.click(resetButton);

    // Time should be back to 0
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('starts timer with keyboard shortcut "p"', () => {
    const { rerender } = render(<ElapsedTime />);

    // Set a fixed speed for consistent testing
    const speedSelect = screen.getByRole('combobox');
    fireEvent.change(speedSelect, { target: { value: '60' } });

    // Simulate pressing 'p' key
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(50); // Should be enough for several seconds at 60x
    });

    // Force a rerender to ensure the component updates
    rerender(<ElapsedTime />);

    // Verify time has advanced (no longer at 0)
    expect(screen.queryByText('00:00:00')).not.toBeInTheDocument();

    // Reset for other tests
    fireEvent.keyDown(document, { key: 'r' });
  });

  it('plays and pauses elapsed time based on play/pause button toggle', () => {
    const { rerender } = render(<ElapsedTime />);

    // Set speed for consistent testing behavior
    const speedSelect = screen.getByRole('combobox');
    fireEvent.change(speedSelect, { target: { value: '60' } });

    const startButton = screen.getByRole('button', { name: /Start timer/i });
    fireEvent.click(startButton);

    // At 60x speed, we need much less real time to advance the simulation time
    act(() => {
      jest.advanceTimersByTime(50); // Should be enough for 3 seconds at 60x speed
    });

    // Force a rerender to ensure the component updates
    rerender(<ElapsedTime />);

    // Check that the elapsed time is no longer 0
    expect(screen.queryByText('00:00:00')).not.toBeInTheDocument();

    // Pause the timer (now it should be a pause button)
    const pauseButton = screen.getByRole('button', { name: /Pause timer/i });
    fireEvent.click(pauseButton);

    // Get the current time for comparison
    const timeDisplayText = screen.getByText(/\d{2}:\d{2}:\d{2}/i).textContent || '';

    // Advance time while paused
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Time should not have changed
    expect(screen.getByText(timeDisplayText)).toBeInTheDocument();
  });

  it('stops timer with keyboard shortcut toggle', () => {
    render(<ElapsedTime />);

    // Start the timer with "p" key
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    // Get the current displayed time text for verification
    const timeDisplayText = screen.getByText(/\d{2}:\d{2}:\d{2}/i).textContent || '';

    // Press p again to toggle pause
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(3000); // Try to advance 3 more seconds, but timer should be stopped
    });

    // Time should not have changed
    expect(screen.getByText(timeDisplayText)).toBeInTheDocument();
  });

  it('resets timer with keyboard shortcut "r"', () => {
    render(<ElapsedTime />);

    // Start and then reset using keyboard shortcuts
    fireEvent.keyDown(document, { key: 'p' });

    act(() => {
      jest.advanceTimersByTime(3000); // Advance 3 seconds
    });

    fireEvent.keyDown(document, { key: 'r' });

    // Time should be reset to 0
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('initializes with initialElapsedTime prop', () => {
    render(<ElapsedTime initialElapsedTime={5} />);
    expect(screen.getByText('00:00:05')).toBeInTheDocument();
  });

  it('calls onElapsedTimeChange callback when time changes', () => {
    const mockCallback = jest.fn();
    render(<ElapsedTime onElapsedTimeChange={mockCallback} />);

    const startButton = screen.getByRole('button', { name: /Start timer/i });
    fireEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(1000); // Advance 1 second
    });

    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('does not call callback multiple times for same time value', () => {
    const mockCallback = jest.fn();
    render(<ElapsedTime onElapsedTimeChange={mockCallback} />);

    const resetButton = screen.getByRole('button', { name: /Reset timer/i });
    // Reset multiple times (same value of 0)
    fireEvent.click(resetButton);
    fireEvent.click(resetButton);

    // Callback should only be called once since time didn't change
    expect(mockCallback).toHaveBeenCalledTimes(0);
  });

  it('always resets to 0, ignoring initialElapsedTime', () => {
    const mockCallback = jest.fn();
    render(<ElapsedTime initialElapsedTime={10} onElapsedTimeChange={mockCallback} />);

    const startButton = screen.getByRole('button', { name: /Start timer/i });
    fireEvent.click(startButton);

    act(() => {
      jest.advanceTimersByTime(2000); // Advance 2 seconds
    });

    const resetButton = screen.getByRole('button', { name: /Reset timer/i });
    fireEvent.click(resetButton);

    expect(screen.getByText('00:00:00')).toBeInTheDocument();
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('renders with default speed of 60x', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');
    expect(speedSelect).toHaveValue('60');
  });

  it('allows changing the simulation speed', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');

    // Change speed to 10x
    fireEvent.change(speedSelect, { target: { value: '10' } });
    expect(speedSelect).toHaveValue('10');

    // Change speed to 120x
    fireEvent.change(speedSelect, { target: { value: '120' } });
    expect(speedSelect).toHaveValue('120');
  });

  it('updates time faster at higher speeds', () => {
    render(<ElapsedTime />);

    const speedSelect = screen.getByRole('combobox');
    const startButton = screen.getByRole('button', { name: /Start timer/i });

    // Set speed to 1x (real time)
    fireEvent.change(speedSelect, { target: { value: '1' } });
    fireEvent.click(startButton);

    // Advance 100ms in real time at 1x speed
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // At 1x speed, 100ms should not be enough to update the time
    expect(screen.getByText('00:00:00')).toBeInTheDocument();

    // Now set speed to 60x
    fireEvent.change(speedSelect, { target: { value: '60' } });

    // Advance 100ms in real time at 60x speed
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // At 60x speed, 100ms is enough to update multiple times
    // 100ms real time at 60x speed should update time by ~6 seconds
    // But we're advancing the timer by specific steps, so we'll just check if it's updated at all
    expect(screen.queryByText('00:00:00')).not.toBeInTheDocument();
  });

  it('allows increasing speed with + key', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');

    // Set initial speed to 10x
    fireEvent.change(speedSelect, { target: { value: '10' } });
    expect(speedSelect).toHaveValue('10');

    // Press + key
    fireEvent.keyDown(document, { key: '+' });

    // Speed should increase to next option (30x)
    expect(speedSelect).toHaveValue('30');
  });

  it('allows decreasing speed with - key', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');

    // Set initial speed to 60x (default)
    expect(speedSelect).toHaveValue('60');

    // Press - key
    fireEvent.keyDown(document, { key: '-' });

    // Speed should decrease to previous option (30x)
    expect(speedSelect).toHaveValue('30');
  });

  it('handles equals key as alternative for increasing speed', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');

    // Set initial speed to 10x
    fireEvent.change(speedSelect, { target: { value: '10' } });
    expect(speedSelect).toHaveValue('10');

    // Press = key (alternative for + without shift)
    fireEvent.keyDown(document, { key: '=' });

    // Speed should increase to next option (30x)
    expect(speedSelect).toHaveValue('30');
  });

  it('handles underscore key as alternative for decreasing speed', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');

    // Set initial speed to 60x (default)
    expect(speedSelect).toHaveValue('60');

    // Press _ key (alternative for - with shift)
    fireEvent.keyDown(document, { key: '_' });

    // Speed should decrease to previous option (30x)
    expect(speedSelect).toHaveValue('30');
  });

  it('prevents speed from going beyond min and max values', () => {
    render(<ElapsedTime />);
    const speedSelect = screen.getByRole('combobox');

    // Set to minimum speed (1x)
    fireEvent.change(speedSelect, { target: { value: '1' } });
    expect(speedSelect).toHaveValue('1');

    // Try to decrease below minimum
    fireEvent.keyDown(document, { key: '-' });
    // Should stay at minimum
    expect(speedSelect).toHaveValue('1');

    // Set to maximum speed (120x)
    fireEvent.change(speedSelect, { target: { value: '120' } });
    expect(speedSelect).toHaveValue('120');

    // Try to increase beyond maximum
    fireEvent.keyDown(document, { key: '+' });
    // Should stay at maximum
    expect(speedSelect).toHaveValue('120');
  });
});
