/**
 * Generates a simple letter code based on date, time, and user UUID hash
 * Format: DDMMHHMM-XX -> converts each digit to a letter (0=A, 1=B, ..., 9=J)
 * The suffix is derived from the user's UUID for consistency and uniqueness
 * Example: Meeting on 15th at 2:30 PM (14:30) -> "BFBEBEDA-GH"
 */
export function generateMeetingCode(
  date: Date,
  timeString: string,
  userUuid: string
): string {
  // Parse the time string (e.g., "2:30 PM")
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);

  // Convert to 24-hour format
  let finalHours = hours;
  if (period === 'PM' && hours !== 12) {
    finalHours += 12;
  } else if (period === 'AM' && hours === 12) {
    finalHours = 0;
  }

  // Get date components
  const day = date.getDate();
  const month = date.getMonth() + 1; // months are 0-indexed

  // Create a string with: DDMMHHMM
  const dateTimeString = [
    day.toString().padStart(2, '0'),
    month.toString().padStart(2, '0'),
    finalHours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
  ].join('');

  // Convert each digit to a letter (0=A, 1=B, 2=C, ..., 9=J)
  const dateTimeCode = dateTimeString
    .split('')
    .map((digit) => String.fromCharCode(65 + parseInt(digit)))
    .join('');

  // Create a simple hash from UUID by summing character codes
  // Take last 2 digits to create a consistent suffix for this user
  let hash = 0;
  for (let i = 0; i < userUuid.length; i++) {
    hash += userUuid.charCodeAt(i);
  }

  // Get last 2 digits of hash (00-99)
  const userSuffix = (hash % 100)
    .toString()
    .padStart(2, '0')
    .split('')
    .map((digit) => String.fromCharCode(65 + parseInt(digit)))
    .join('');

  return `${dateTimeCode}-${userSuffix}`;
}

/**
 * Generates a meeting code for instant meetings (without scheduled time)
 * Uses current date/time (exact minute, no rounding) + user UUID hash
 */
export function generateInstantMeetingCode(userUuid: string): string {
  const now = new Date();

  // Don't round - use exact current time down to the minute

  // Convert to 12-hour format string
  let hours = now.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeString = `${hours}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')} ${period}`;

  return generateMeetingCode(now, timeString, userUuid);
}
