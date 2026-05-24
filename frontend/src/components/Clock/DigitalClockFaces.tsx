import type { TimeState } from '../../types';
import { formatHours, padZero, getAmPm } from '../../utils/dateUtils';
import './Clock.css';

interface DigitalClockProps {
  time: TimeState;
  format: '12h' | '24h';
}

/**
 * Stacked digital clock face: large hour on top, minutes on bottom.
 * Sleek, bold typography with a luxury aesthetic.
 */
export function StackedDigitalClock({ time, format }: DigitalClockProps) {
  const { hours, minutes } = time;
  const displayHours = formatHours(hours, format);
  const displayMinutes = padZero(minutes);

  return (
    <div className="stacked-clock" role="timer" aria-label={`${displayHours} ${displayMinutes}`}>
      <div className="stacked-clock__hours">{displayHours}</div>
      <div className="stacked-clock__minutes">{displayMinutes}</div>
      {format === '12h' && (
        <div className="stacked-clock__ampm">{getAmPm(hours)}</div>
      )}
    </div>
  );
}

/**
 * Retro grid digital clock face.
 * Implements a matrix-like grid structure and monospaced neon digital readout.
 */
export function RetroDigitalClock({ time, format }: DigitalClockProps) {
  const { hours, minutes, seconds } = time;
  const displayHours = formatHours(hours, format);
  const displayMinutes = padZero(minutes);
  const displaySeconds = padZero(seconds);

  return (
    <div className="retro-clock" role="timer" aria-label={`${displayHours}:${displayMinutes}:${displaySeconds}`}>
      <div className="retro-clock__grid-bg" />
      <div className="retro-clock__time">
        <span className="retro-clock__digits">{displayHours}</span>
        <span className="retro-clock__colon">:</span>
        <span className="retro-clock__digits">{displayMinutes}</span>
        <span className="retro-clock__colon">:</span>
        <span className="retro-clock__digits">{displaySeconds}</span>
        {format === '12h' && (
          <span className="retro-clock__ampm">{getAmPm(hours)}</span>
        )}
      </div>
    </div>
  );
}
