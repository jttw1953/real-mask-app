// utils/timeUtils.ts
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a UTC ISO string to the user's local timezone Date object
 * @param utcIsoString - UTC ISO string from database (e.g., "2025-11-04T18:30:00.000Z")
 * @returns Date object in user's local timezone
 */
export function utcToLocal(utcIsoString: string): Date {
  const userTZ = getUserTimezone();
  const utcDate = parseISO(utcIsoString);
  return toZonedTime(utcDate, userTZ);
}

/**
 * Convert a local Date object to UTC ISO string for database storage
 * @param localDate - Date object in user's local timezone
 * @returns UTC ISO string for database
 */
export function localToUtc(localDate: Date): string {
  const userTZ = getUserTimezone();
  const utcDate = fromZonedTime(localDate, userTZ);
  return utcDate.toISOString();
}

/**
 * Format a UTC ISO string to display time in user's local timezone
 * @param utcIsoString - UTC ISO string from database
 * @param formatString - date-fns format string (default: "h:mm a")
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatMeetingTime(
  utcIsoString: string,
  formatString: string = 'h:mm a'
): string {
  const localDate = utcToLocal(utcIsoString);
  return format(localDate, formatString);
}

/**
 * Format a UTC ISO string to display date and time in user's local timezone
 * @param utcIsoString - UTC ISO string from database
 * @returns Formatted date-time string (e.g., "Nov 4, 2025 2:30 PM")
 */
export function formatMeetingDateTime(utcIsoString: string): string {
  const localDate = utcToLocal(utcIsoString);
  return format(localDate, 'MMM d, yyyy h:mm a');
}

/**
 * Parse a time string (e.g., "2:30 PM") and combine with a date to create UTC ISO string
 * @param date - Local date (JavaScript Date object)
 * @param timeString - Time string in format "h:mm a" (e.g., "2:30 PM")
 * @returns UTC ISO string for database
 */
export function combineLocalDateTimeToUtc(
  date: Date,
  timeString: string
): string {
  // Parse the time string
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);

  // Convert to 24-hour format
  let finalHours = hours;
  if (period === 'PM' && hours !== 12) {
    finalHours += 12;
  } else if (period === 'AM' && hours === 12) {
    finalHours = 0;
  }

  // Create a new date with the selected date and time (in local timezone)
  const localDateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    finalHours,
    minutes,
    0,
    0
  );

  // Convert to UTC ISO string
  return localDateTime.toISOString();
}

/**
 * Get current date-time rounded to next 15-minute interval
 * @returns Object with date and time string
 */
export function getDefaultDateTime(): { date: Date; timeString: string } {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;

  const roundedDate = new Date(now);
  if (roundedMinutes === 60) {
    roundedDate.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    roundedDate.setMinutes(roundedMinutes, 0, 0);
  }

  const timeString = format(roundedDate, 'h:mm a');

  return {
    date: roundedDate,
    timeString,
  };
}
