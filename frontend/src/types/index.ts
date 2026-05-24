export interface TimeState {
  hours: number;
  minutes: number;
  seconds: number;
  date: Date;
}

export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number;
}

export type ClockMode = 'analog' | 'digital';
export type CalendarView = 'month' | 'year';
export type ThemeMode = 'deep-space' | 'amoled-black' | 'cyberpunk' | 'forest-canopy' | 'warm-amber';
export type ClockNumbersMode = 'none' | 'accents' | 'all';
export type TickDensityMode = 'all' | 'major' | 'none';

export type ClockStyleMode = 'classic-analog' | 'minimalist-analog' | 'chronograph' | 'stacked-digital' | 'retro-digital';
export type CalendarStyleMode = 'month-grid' | 'weekly-agenda' | 'year-overview';

export interface UserSettings {
  clockMode: ClockMode;
  calendarView: CalendarView;
  timeFormat: '12h' | '24h';
  showWeekNumbers: boolean;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  theme: ThemeMode;
  clockNumbers: ClockNumbersMode;
  showSecondsHand: boolean;
  tickDensity: TickDensityMode;
  clockStyle: ClockStyleMode;
  calendarStyle: CalendarStyleMode;
}

export const DEFAULT_SETTINGS: UserSettings = {
  clockMode: 'analog',
  calendarView: 'month',
  timeFormat: '24h',
  showWeekNumbers: false,
  weekStartsOn: 1,
  theme: 'deep-space',
  clockNumbers: 'none',
  showSecondsHand: true,
  tickDensity: 'all',
  clockStyle: 'classic-analog',
  calendarStyle: 'month-grid',
};
