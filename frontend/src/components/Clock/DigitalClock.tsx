import type { TimeState } from '../../types';
import { formatHours, getAmPm, padZero, getDayName, getFormattedDate } from '../../utils/dateUtils';
import './Clock.css';

interface DigitalClockProps {
  time: TimeState;
  format: '12h' | '24h';
}

/**
 * Digital clock display with pulsing colon separator.
 * Shows time in large monospace font with date context below.
 */
export function DigitalClock({ time, format }: DigitalClockProps) {
  const { hours, minutes, seconds, date } = time;
  const displayHours = formatHours(hours, format);
  const displayMinutes = padZero(minutes);
  const displaySeconds = padZero(seconds);

  return (
    <div className="digital-clock" role="timer" aria-label={`${displayHours}:${displayMinutes}:${displaySeconds}`}>
      <div className="digital-clock__time">
        <span>{displayHours}</span>
        <span className="digital-clock__colon">:</span>
        <span>{displayMinutes}</span>
        <span className="digital-clock__seconds">{displaySeconds}</span>
        {format === '12h' && (
          <span className="digital-clock__ampm">{getAmPm(hours)}</span>
        )}
      </div>
      <div className="digital-clock__date">
        {getDayName(date)} · {getFormattedDate(date)}
      </div>
    </div>
  );
}
