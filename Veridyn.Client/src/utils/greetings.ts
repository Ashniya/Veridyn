/**
 * Helper to compute time-of-day greeting (Good morning, Good afternoon, Good evening)
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};

/**
 * Returns a friendly personalized greeting string
 */
export const formatUserGreeting = (fullName?: string, fallbackRole: string = 'User'): string => {
  const greeting = getTimeBasedGreeting();
  if (fullName && fullName.trim()) {
    return `${greeting}, ${fullName.trim()}`;
  }
  return `${greeting}, ${fallbackRole}`;
};
