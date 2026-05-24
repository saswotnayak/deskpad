import { getDayName, getFormattedDate } from '../../utils/dateUtils';
import './DateDisplay.css';

interface DateDisplayProps {
  date: Date;
}

/**
 * Displays current day name and full date.
 * Shown below the analog clock.
 */
export function DateDisplay({ date }: DateDisplayProps) {
  return (
    <div className="date-display" id="date-display">
      <div className="date-display__day-name">{getDayName(date)}</div>
      <div className="date-display__full-date">{getFormattedDate(date)}</div>
    </div>
  );
}
