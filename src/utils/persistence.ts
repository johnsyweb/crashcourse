/**
 * Utility functions for persisting application state to localStorage
 */

const STORAGE_KEY_PREFIX = 'crashcourse_';

/**
 * Generic function to save data to localStorage
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, serializedData);
  } catch (error) {
    console.warn(`Failed to save data to localStorage for key "${key}":`, error);
  }
}

/**
 * Generic function to load data from localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const serializedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.warn(`Failed to load data from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
  } catch (error) {
    console.warn(`Failed to remove data from localStorage for key "${key}":`, error);
  }
}

/**
 * Clear all crashcourse-related data from localStorage
 */
export function clearAllStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  COURSE_POINTS: 'course_points',
  PARTICIPANTS: 'participants',
  FINISHED_PARTICIPANTS: 'finished_participants',
  ELAPSED_TIME: 'elapsed_time',
  ACTIVE_TAB: 'active_tab',
  SELECTED_POINT: 'selected_point',
  SELECTED_POINTS: 'selected_points',
  SIMULATOR_STATE: 'simulator_state',
  PARTICIPANT_COUNT: 'participant_count',
  MIN_PACE: 'min_pace',
  MAX_PACE: 'max_pace',
} as const;
