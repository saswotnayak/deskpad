/**
 * Format hours based on 12h/24h preference.
 */
export function formatHours(hours: number, format: '12h' | '24h'): string {
  if (format === '24h') {
    return hours.toString().padStart(2, '0');
  }
  const h = hours % 12 || 12;
  return h.toString();
}

/**
 * Get AM/PM suffix for 12h format.
 */
export function getAmPm(hours: number): string {
  return hours >= 12 ? 'PM' : 'AM';
}

/**
 * Pad a number with leading zeros.
 */
export function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Get the full day name (e.g., "Saturday").
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get formatted date string (e.g., "May 17, 2025").
 */
export function getFormattedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get short month name (e.g., "May").
 */
export function getShortMonthName(month: number): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Get full month name (e.g., "May").
 */
export function getFullMonthName(month: number): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get short day name (e.g., "Sat").
 */
export function getDayNameShort(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}
