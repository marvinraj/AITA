// Utility functions for date handling in the itinerary system

/**
 * Generate array of date strings between start and end date (inclusive)
 */
export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Handle invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return dates;
  }
  
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD format
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Format date for day headers: "Tuesday, 22 Jul"
 */
export const formatDayHeader = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  
  return `${dayOfWeek}, ${day} ${month}`;
};

/**
 * Format date for date picker buttons: "22 July"
 */
export const formatDateButton = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid';
  }
  
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  
  return `${day} ${month}`;
};

/**
 * Get day of week for a date string
 */
export const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Check if a date string is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.toDateString() === today.toDateString();
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Sort dates in ascending order
 */
export const sortDates = (dates: string[]): string[] => {
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

/**
 * Check if date is within trip range
 */
export const isDateInTripRange = (date: string, startDate: string, endDate: string): boolean => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return checkDate >= start && checkDate <= end;
};
