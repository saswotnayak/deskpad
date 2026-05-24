import { useMemo } from 'react';
import { getShortMonthName, getDayNameShort } from '../../utils/dateUtils';
import './Calendar.css';

interface WeeklyAgendaProps {
  weekStartsOn: 0 | 1;
}

/**
 * Weekly Agenda view.
 * Shows a horizontal grid of 7 day cards for the current week.
 * Dynamically calculated based on weekStartsOn settings.
 */
export function WeeklyAgenda({ weekStartsOn }: WeeklyAgendaProps) {
  const today = new Date();

  const weekDays = useMemo(() => {
    const currentDay = today.getDay(); // 0 = Sun, 6 = Sat
    let diff = currentDay - weekStartsOn;
    if (diff < 0) diff += 7;

    const start = new Date(today);
    start.setDate(today.getDate() - diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStartsOn]);

  return (
    <div className="weekly-agenda" id="weekly-agenda">
      <div className="weekly-agenda__header">
        <h2 className="weekly-agenda__title">Weekly Agenda</h2>
        <span className="weekly-agenda__subtitle">
          Week {Math.ceil((today.getDate() - today.getDay() + 1) / 7) + 1}
        </span>
      </div>

      <div className="weekly-agenda__grid">
        {weekDays.map((dayDate, i) => {
          const isToday =
            dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear();

          const dayOfWeek = dayDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div
              key={i}
              className={`weekly-agenda__card ${isToday ? 'weekly-agenda__card--today' : ''} ${
                isWeekend ? 'weekly-agenda__card--weekend' : ''
              }`}
            >
              <div className="weekly-agenda__card-header">
                <span className="weekly-agenda__card-day">{getDayNameShort(dayDate)}</span>
                <span className="weekly-agenda__card-date">
                  {dayDate.getDate()} {getShortMonthName(dayDate.getMonth())}
                </span>
              </div>
              
              <div className="weekly-agenda__card-body">
                {isToday ? (
                  <div className="weekly-agenda__empty-today">
                    <span className="weekly-agenda__empty-dot" />
                    Today clear
                  </div>
                ) : (
                  <span className="weekly-agenda__empty-text">No events</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
