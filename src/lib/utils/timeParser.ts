'use client';

/**
 * Parses a flexible time input string into minutes
 * Supports formats like:
 * - 15 (interpreted as 15 minutes)
 * - 15m (15 minutes)
 * - 15min (15 minutes)
 * - 1h (1 hour = 60 minutes)
 * - 1.5h (1.5 hours = 90 minutes)
 * - 1h 30m (1 hour 30 minutes = 90 minutes)
 * - 1h 30 (1 hour 30 minutes = 90 minutes)
 * - 1:30 (1 hour 30 minutes = 90 minutes)
 * 
 * @param input The time input string to parse
 * @returns The time in minutes
 */
export function parseTimeInput(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Clean up the input
  const cleaned = input.trim().toLowerCase();
  
  // Try matching different patterns
  
  // Case: hh:mm format (e.g., "1:30")
  const timeFormat = /^(\d+):(\d{1,2})$/.exec(cleaned);
  if (timeFormat) {
    const hours = parseInt(timeFormat[1], 10);
    const minutes = parseInt(timeFormat[2], 10);
    return (hours * 60) + minutes;
  }
  
  // Case: "1h 30m" or "1h 30" or variations
  const hourMinuteFormat = /^(\d+\.?\d*)\s*h(?:ours?)?(?:\s+(\d+)\s*m(?:in(?:ute)?s?)?)?$/.exec(cleaned);
  if (hourMinuteFormat) {
    const hours = parseFloat(hourMinuteFormat[1]);
    const minutes = hourMinuteFormat[2] ? parseInt(hourMinuteFormat[2], 10) : 0;
    return Math.round((hours * 60) + minutes);
  }
  
  // Case: Just minutes: "30m" or "30min" or "30"
  const minutesFormat = /^(\d+\.?\d*)\s*m(?:in(?:ute)?s?)?$/.exec(cleaned);
  if (minutesFormat) {
    return Math.round(parseFloat(minutesFormat[1]));
  }
  
  // Case: Just hours: "1.5h" or "1.5 hours"
  const hoursFormat = /^(\d+\.?\d*)\s*h(?:ours?)?$/.exec(cleaned);
  if (hoursFormat) {
    return Math.round(parseFloat(hoursFormat[1]) * 60);
  }
  
  // Case: Just a number (interpret as minutes)
  const justNumber = /^(\d+\.?\d*)$/.exec(cleaned);
  if (justNumber) {
    return Math.round(parseFloat(justNumber[1]));
  }
  
  // Couldn't parse
  return null;
}

/**
 * Convert a time in minutes to a formatted string (e.g., "1h 30m")
 * 
 * @param minutes The time in minutes to format
 * @returns A formatted time string
 */
export function formatTimeFromMinutes(minutes: number): string {
  if (minutes < 0) {
    return '0m';
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${remainingMinutes}m`;
  }
}