import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getGreeting, getMsUntilNextBoundary } from '../utils/greeting';

export const useGreeting = (): string => {
  const [greeting, setGreeting] = useState(() => getGreeting());

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const updateGreeting = () => {
      setGreeting(getGreeting());

      // Calculate delay until the next transition
      const delay = getMsUntilNextBoundary();

      // Clear previous timer just in case
      if (timerId) {
        clearTimeout(timerId);
      }

      // Schedule the next check (plus a tiny safety margin of 100ms to ensure the clock has rolled over)
      timerId = setTimeout(updateGreeting, delay + 100);
    };

    // Initial setup on mount
    updateGreeting();

    // AppState listener to handle background-to-foreground transitions
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateGreeting();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
      subscription.remove();
    };
  }, []);

  return greeting;
};
