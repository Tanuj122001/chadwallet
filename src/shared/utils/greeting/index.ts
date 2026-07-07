/**
 * Returns a time-based greeting using the user's local device time.
 *
 * Greeting Rules:
 * 00:00 — 04:59 : Good Night 🌙
 * 05:00 — 11:59 : Good Morning ☀️
 * 12:00 — 16:59 : Good Afternoon 🌤️
 * 17:00 — 20:59 : Good Evening 🌇
 * 21:00 — 23:59 : Good Night 🌙
 */
export const getGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning ☀️';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon 🌤️';
  }
  if (hour >= 17 && hour < 21) {
    return 'Good Evening 🌇';
  }
  return 'Good Night 🌙';
};

/**
 * Calculates the exact number of milliseconds remaining until the next greeting transition.
 * Transitions occur at: 00:00, 05:00, 12:00, 17:00, 21:00.
 */
export const getMsUntilNextBoundary = (now: Date = new Date()): number => {
  const currentHour = now.getHours();

  const boundaries = [0, 5, 12, 17, 21];
  let nextBoundaryHour = 0;
  let dayOffset = 0;

  // Find the first boundary that is strictly greater than the current hour
  const nextHourIndex = boundaries.findIndex(h => h > currentHour);
  if (nextHourIndex !== -1) {
    nextBoundaryHour = boundaries[nextHourIndex];
  } else {
    // If currentHour >= 21, the next boundary is 00:00 of the next day
    nextBoundaryHour = 0;
    dayOffset = 1;
  }

  // Create the target date
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + dayOffset);
  targetDate.setHours(nextBoundaryHour, 0, 0, 0);

  return targetDate.getTime() - now.getTime();
};
