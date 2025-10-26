import { useState, useCallback } from 'react';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './persistence';

/**
 * Custom hook for managing persistent state with localStorage
 * @param key - The storage key to use
 * @param defaultValue - The default value if nothing is stored
 * @returns [value, setValue] - Similar to useState but with persistence
 */
export function usePersistentState<T>(
  key: keyof typeof STORAGE_KEYS,
  defaultValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    return loadFromStorage(STORAGE_KEYS[key], defaultValue);
  });

  const setPersistentValue = useCallback(
    (newValue: T | ((prevValue: T) => T)) => {
      setValue((prevValue) => {
        const resolvedValue =
          typeof newValue === 'function' ? (newValue as (prevValue: T) => T)(prevValue) : newValue;
        saveToStorage(STORAGE_KEYS[key], resolvedValue);
        return resolvedValue;
      });
    },
    [key]
  );

  // Note: We removed the useEffect that synced with localStorage
  // because it required calling setState in an effect, which is not recommended in React 19
  // The initial value is loaded correctly via the useState initializer
  // For loading external changes during component lifecycle, consider using an event listener or similar pattern

  return [value, setPersistentValue];
}

/**
 * Custom hook for managing persistent state that can be cleared
 * @param key - The storage key to use
 * @param defaultValue - The default value if nothing is stored
 * @returns [value, setValue, clearValue] - Similar to useState but with persistence and clear
 */
export function usePersistentStateWithClear<T>(
  key: keyof typeof STORAGE_KEYS,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    return loadFromStorage(STORAGE_KEYS[key], defaultValue);
  });

  const setPersistentValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      saveToStorage(STORAGE_KEYS[key], newValue);
    },
    [key]
  );

  const clearValue = useCallback(() => {
    setValue(defaultValue);
    saveToStorage(STORAGE_KEYS[key], defaultValue);
  }, [key, defaultValue]);

  // Note: We removed the useEffect that synced with localStorage
  // because it required calling setState in an effect, which is not recommended in React 19
  // The initial value is loaded correctly via the useState initializer

  return [value, setPersistentValue, clearValue];
}
