import { useState, useCallback, useRef, useEffect } from 'react';

export interface UndoRedoState<T> {
  current: T;
  history: T[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface UndoRedoActions<T> {
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

/**
 * Custom hook for managing undo/redo functionality
 * @param initialState The initial state value
 * @param maxHistorySize Maximum number of history entries to keep (default: 50)
 * @returns Current state and undo/redo actions
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistorySize: number = 50
): UndoRedoState<T> & UndoRedoActions<T> {
  const [state, setState] = useState<UndoRedoState<T>>({
    current: initialState,
    history: [initialState],
    historyIndex: 0,
    canUndo: false,
    canRedo: false,
  });

  const maxHistoryRef = useRef(maxHistorySize);

  // Update canUndo and canRedo flags
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      canUndo: prev.historyIndex > 0,
      canRedo: prev.historyIndex < prev.history.length - 1,
    }));
  }, [state.historyIndex, state.history.length]);

  const setNewState = useCallback((newState: T) => {
    setState((prev) => {
      // Don't add to history if the state hasn't changed
      if (JSON.stringify(prev.current) === JSON.stringify(newState)) {
        return prev;
      }

      // Create new history by removing any "future" entries and adding the new state
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newState);

      // Trim history if it exceeds max size
      if (newHistory.length > maxHistoryRef.current) {
        newHistory.shift();
      } else {
        // Only increment index if we didn't trim from the beginning
        return {
          current: newState,
          history: newHistory,
          historyIndex: prev.historyIndex + 1,
          canUndo: prev.historyIndex >= 0,
          canRedo: false,
        };
      }

      return {
        current: newState,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        canUndo: newHistory.length > 1,
        canRedo: false,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          current: prev.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          current: prev.history[newIndex],
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const clear = useCallback(() => {
    setState({
      current: initialState,
      history: [initialState],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  }, [initialState]);

  return {
    ...state,
    setState: setNewState,
    undo,
    redo,
    clear,
  };
}

/**
 * Hook for adding keyboard shortcuts to undo/redo functionality
 * @param undo Function to call for undo
 * @param redo Function to call for redo
 * @param enabled Whether keyboard shortcuts are enabled (default: true)
 */
export function useUndoRedoKeyboard(undo: () => void, redo: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (or Cmd+Z on Mac) for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      // Check for Ctrl+Y (or Cmd+Shift+Z on Mac) for redo
      else if (
        (event.ctrlKey && event.key === 'y') ||
        (event.metaKey && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, enabled]);
}
