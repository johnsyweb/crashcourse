import { renderHook, act } from '@testing-library/react';
import { useUndoRedo, useUndoRedoKeyboard } from './useUndoRedo';

describe('useUndoRedo', () => {
  it('should initialize with the provided initial state', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    expect(result.current.current).toBe('initial');
    expect(result.current.history).toEqual(['initial']);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should update state and add to history', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.setState('first');
    });

    expect(result.current.current).toBe('first');
    expect(result.current.history).toEqual(['initial', 'first']);
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should not add duplicate states to history', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.setState('first');
    });

    act(() => {
      result.current.setState('first'); // Same state
    });

    expect(result.current.history).toEqual(['initial', 'first']);
    expect(result.current.historyIndex).toBe(1);
  });

  it('should undo to previous state', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.setState('first');
    });

    act(() => {
      result.current.setState('second');
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.current).toBe('first');
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo to next state', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.setState('first');
    });

    act(() => {
      result.current.setState('second');
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(result.current.current).toBe('second');
    expect(result.current.historyIndex).toBe(2);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should not undo when at the beginning', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.undo();
    });

    expect(result.current.current).toBe('initial');
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
  });

  it('should not redo when at the end', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.setState('first');
    });

    act(() => {
      result.current.redo();
    });

    expect(result.current.current).toBe('first');
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear history and reset to initial state', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.setState('first');
    });

    act(() => {
      result.current.setState('second');
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.current).toBe('initial');
    expect(result.current.history).toEqual(['initial']);
    expect(result.current.historyIndex).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should limit history size', () => {
    const { result } = renderHook(() => useUndoRedo('initial', 3));

    act(() => {
      result.current.setState('first');
    });

    act(() => {
      result.current.setState('second');
    });

    act(() => {
      result.current.setState('third');
    });

    act(() => {
      result.current.setState('fourth');
    });

    expect(result.current.history).toEqual(['second', 'third', 'fourth']);
    expect(result.current.historyIndex).toBe(2);
  });

  it('should work with complex objects', () => {
    const initial = { points: [], name: 'test' };
    const { result } = renderHook(() => useUndoRedo(initial));

    act(() => {
      result.current.setState({ points: [1, 2, 3], name: 'test' });
    });

    expect(result.current.current).toEqual({ points: [1, 2, 3], name: 'test' });
    expect(result.current.canUndo).toBe(true);
  });
});

describe('useUndoRedoKeyboard', () => {
  let mockUndo: jest.Mock;
  let mockRedo: jest.Mock;

  beforeEach(() => {
    mockUndo = jest.fn();
    mockRedo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call undo on Ctrl+Z', () => {
    renderHook(() => useUndoRedoKeyboard(mockUndo, mockRedo));

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('should call redo on Ctrl+Y', () => {
    renderHook(() => useUndoRedoKeyboard(mockUndo, mockRedo));

    const event = new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockRedo).toHaveBeenCalledTimes(1);
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('should call redo on Cmd+Shift+Z (Mac)', () => {
    renderHook(() => useUndoRedoKeyboard(mockUndo, mockRedo));

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    });

    document.dispatchEvent(event);

    expect(mockRedo).toHaveBeenCalledTimes(1);
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('should not call handlers when disabled', () => {
    renderHook(() => useUndoRedoKeyboard(mockUndo, mockRedo, false));

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('should not interfere with other keyboard events', () => {
    renderHook(() => useUndoRedoKeyboard(mockUndo, mockRedo));

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
    });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });
});
