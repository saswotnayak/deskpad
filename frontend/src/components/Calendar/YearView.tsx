import { useMemo } from 'react';
import { generateMiniCalendarGrid } from '../../utils/calendarUtils';
import { getShortMonthName } from '../../utils/dateUtils';
import './Calendar.css';

interface YearViewProps {
  year: number;
  currentMonth: number;
  weekStartsOn: 0 | 1;
  onSelectMonth: (month: number) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

/**
 * Year overview showing 12 mini-month previews in a 4×3 grid.
 * Tap a month to navigate to its MonthView.
 */
export function YearView({
  year,
  currentMonth,
  weekStartsOn,
  onSelectMonth,
  onPrevYear,
  onNextYear,
}: YearViewProps) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => ({
      month,
      name: getShortMonthName(month),
      weeks: generateMiniCalendarGrid(year, month, weekStartsOn),
      isCurrent: year === todayYear && month === currentMonth,
    }));
  }, [year, weekStartsOn, currentMonth, todayYear]);

  return (
    <div className="year-view" id="year-view">
      {/* Header */}
      <div className="year-view__header">
        <h2 className="year-view__title">{year}</h2>
        <div className="year-view__nav">
          <button
            className="year-view__nav-btn"
            onClick={onPrevYear}
            aria-label="Previous year"
            id="year-prev-btn"
          >
            ‹
          </button>
          <button
            className="year-view__nav-btn"
            onClick={onNextYear}
            aria-label="Next year"
            id="year-next-btn"
          >
            ›
          </button>
        </div>
      </div>

      {/* 4×3 mini-month grid */}
      <div className="year-view__grid">
        {months.map(({ month, name, weeks, isCurrent }) => (
          <div
            key={month}
            className={`year-view__month-card ${isCurrent ? 'year-view__month-card--current' : ''}`}
            onClick={() => onSelectMonth(month)}
            role="button"
            tabIndex={0}
            aria-label={`Go to ${name} ${year}`}
          >
            <div className="year-view__month-name">{name}</div>
            <div className="year-view__mini-grid">
              {weeks.map((week, wi) =>
                week.map((day, di) => {
                  const isToday =
                    day.year === todayYear &&
                    day.month === todayMonth &&
                    day.date === todayDate;

                  const classes = ['year-view__mini-day'];
                  if (day.isCurrentMonth) classes.push('year-view__mini-day--current-month');
                  if (isToday) classes.push('year-view__mini-day--today');

                  return (
                    <span key={`${wi}-${di}`} className={classes.join(' ')}>
                      {day.isCurrentMonth ? day.date : ''}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
