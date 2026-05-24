import type { CalendarDay } from '../types';

/**
 * Get the number of days in a given month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of the week the month starts on (0 = Sun, 6 = Sat).
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get ISO week number for a given date.
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Check if a date is today.
 */
function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

/**
 * Generate a 6-row calendar grid for a given month.
 * Includes trailing days from previous month and leading days from next month.
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 = 1
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Adjust first day based on week start
  let startOffset = firstDay - weekStartsOn;
  if (startOffset < 0) startOffset += 7;

  // Previous month trailing days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  for (let i = startOffset - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const dayOfWeek = new Date(prevYear, prevMonth, date).getDay();
    days.push({
      date,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: isToday(prevYear, prevMonth, date),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // Current month days
  for (let date = 1; date <= daysInMonth; date++) {
    const dayOfWeek = new Date(year, month, date).getDay();
    days.push({
      date,
      month,
      year,
      isCurrentMonth: true,
      isToday: isToday(year, month, date),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // Next month leading days (fill to 42 = 6 rows)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remaining = 42 - days.length;

  for (let date = 1; date <= remaining; date++) {
    const dayOfWeek = new Date(nextYear, nextMonth, date).getDay();
    days.push({
      date,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: isToday(nextYear, nextMonth, date),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  return days;
}

/**
 * Generate a mini calendar grid for year view (just need week structure).
 */
export function generateMiniCalendarGrid(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 = 1
): CalendarDay[][] {
  const allDays = generateCalendarGrid(year, month, weekStartsOn);
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}
