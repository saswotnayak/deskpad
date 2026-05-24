import { useMemo } from 'react';
import { generateCalendarGrid, getWeekNumber } from '../../utils/calendarUtils';
import { getFullMonthName } from '../../utils/dateUtils';
import type { CalendarDay } from '../../types';
import './Calendar.css';

interface MonthViewProps {
  year: number;
  month: number;
  weekStartsOn: 0 | 1;
  showWeekNumbers: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LABELS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LABELS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Month-view calendar grid.
 * Shows 6 rows of days with today highlighted and weekend coloring.
 * Supports optional week numbers column.
 */
export function MonthView({
  year,
  month,
  weekStartsOn,
  showWeekNumbers,
  onPrevMonth,
  onNextMonth,
}: MonthViewProps) {
  const days: CalendarDay[] = useMemo(
    () => generateCalendarGrid(year, month, weekStartsOn),
    [year, month, weekStartsOn]
  );

  const weekdayLabels = weekStartsOn === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN;
  const weekendIndices = weekStartsOn === 1 ? [5, 6] : [0, 6];

  return (
    <div className="month-view" id="month-view">
      {/* Header with month/year and navigation */}
      <div className="month-view__header">
        <h2 className="month-view__title">
          {getFullMonthName(month)} {year}
        </h2>
        <div className="month-view__nav">
          <button
            className="month-view__nav-btn"
            onClick={onPrevMonth}
            aria-label="Previous month"
            id="month-prev-btn"
          >
            ‹
          </button>
          <button
            className="month-view__nav-btn"
            onClick={onNextMonth}
            aria-label="Next month"
            id="month-next-btn"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className={`month-view__weekdays ${showWeekNumbers ? 'month-view__weekdays--with-week-numbers' : ''}`}>
        {showWeekNumbers && <div className="month-view__weekday" />}
        {weekdayLabels.map((label, i) => (
          <div
            key={label}
            className={`month-view__weekday ${weekendIndices.includes(i) ? 'month-view__weekday--weekend' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className={`month-view__grid ${showWeekNumbers ? 'month-view__grid--with-week-numbers' : ''}`}>
        {days.map((day, i) => {
          const elements = [];

          // Render week number at the start of each row
          if (showWeekNumbers && i % 7 === 0) {
            const weekDate = new Date(day.year, day.month, day.date);
            const wNum = getWeekNumber(weekDate);
            elements.push(
              <div key={`w-${i}`} className="month-view__week-number">
                W{wNum}
              </div>
            );
          }

          const classes = ['month-view__day'];
          if (!day.isCurrentMonth) classes.push('month-view__day--other-month');
          if (day.isWeekend) classes.push('month-view__day--weekend');
          if (day.isToday) classes.push('month-view__day--today');

          elements.push(
            <div key={i} className={classes.join(' ')}>
              {day.date}
            </div>
          );

          return elements;
        })}
      </div>
    </div>
  );
}
