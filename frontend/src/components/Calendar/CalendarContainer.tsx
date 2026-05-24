import { useState, useCallback } from 'react';
import { MonthView } from './MonthView';
import { WeeklyAgenda } from './WeeklyAgenda';
import { YearView } from './YearView';
import { useLongPress } from '../../hooks/useLongPress';
import { useSettings } from '../../hooks/useSettings';
import type { CalendarStyleMode } from '../../types';
import './Calendar.css';

const CALENDAR_STYLES: { id: CalendarStyleMode; name: string }[] = [
  { id: 'month-grid', name: 'Month Grid' },
  { id: 'weekly-agenda', name: 'Weekly Agenda' },
  { id: 'year-overview', name: 'Year Overview' },
];

/**
 * Calendar container that manages interactive style selection.
 * Long press to enter edit mode, then swipe or use controls to cycle views.
 */
export function CalendarContainer() {
  const today = new Date();
  const { settings, updateSetting } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Resolve style, falling back to legacy settings for backwards compatibility
  const activeStyle = settings.calendarStyle || (settings.calendarView === 'year' ? 'year-overview' : 'month-grid');
  const activeIndex = CALENDAR_STYLES.findIndex((s) => s.id === activeStyle);

  const setStyleIndex = useCallback((index: number) => {
    const nextStyle = CALENDAR_STYLES[index].id;
    updateSetting('calendarStyle', nextStyle);

    // Sync legacy calendarView for compatibility
    const nextView = nextStyle === 'year-overview' ? 'year' : 'month';
    updateSetting('calendarView', nextView);
  }, [updateSetting]);

  const nextStyle = useCallback(() => {
    const nextIdx = (activeIndex + 1) % CALENDAR_STYLES.length;
    setStyleIndex(nextIdx);
  }, [activeIndex, setStyleIndex]);

  const prevStyle = useCallback(() => {
    const nextIdx = (activeIndex - 1 + CALENDAR_STYLES.length) % CALENDAR_STYLES.length;
    setStyleIndex(nextIdx);
  }, [activeIndex, setStyleIndex]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToPrevYear = useCallback(() => {
    setCurrentYear((y) => y - 1);
  }, []);

  const goToNextYear = useCallback(() => {
    setCurrentYear((y) => y + 1);
  }, []);

  const selectMonth = useCallback((month: number) => {
    setCurrentMonth(month);
    updateSetting('calendarStyle', 'month-grid');
  }, [updateSetting]);

  const triggerEditMode = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const longPressHandlers = useLongPress({
    onLongPress: triggerEditMode,
    threshold: 600,
  });

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isEditing) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      setStartX(clientX);
    } else {
      if ('touches' in e) {
        longPressHandlers.onTouchStart(e as React.TouchEvent);
      } else {
        longPressHandlers.onMouseDown(e as React.MouseEvent);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (isEditing) {
      if (startX === null) return;
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const diff = startX - clientX;
      
      if (Math.abs(diff) > 60) {
        if (diff > 0) {
          nextStyle();
        } else {
          prevStyle();
        }
      }
      setStartX(null);
    } else {
      if ('changedTouches' in e) {
        longPressHandlers.onTouchEnd(e as React.TouchEvent);
      } else if ('touches' in e) {
        longPressHandlers.onTouchEnd(e as any);
      } else {
        longPressHandlers.onMouseUp();
      }
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isEditing) {
      const target = e.target as HTMLElement;
      if (!target.closest('.carousel-arrow') && !target.closest('.carousel-dot')) {
        setIsEditing(false);
      }
    }
  };

  return (
    <div
      className={`calendar-container ${isEditing ? 'widget-container--editing' : ''}`}
      id="calendar-widget"
      onClick={handleContainerClick}
      style={{ cursor: isEditing ? 'grab' : 'pointer' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={isEditing ? undefined : longPressHandlers.onMouseLeave}
    >
      {isEditing && (
        <div className="widget-editing-header">
          <span className="widget-editing-header__title">{CALENDAR_STYLES[activeIndex].name}</span>
          <span className="widget-editing-header__subtitle">Swipe or tap arrows · Tap calendar to select</span>
        </div>
      )}

      {isEditing && (
        <button
          className="carousel-arrow carousel-arrow--left"
          onClick={(e) => {
            e.stopPropagation();
            prevStyle();
          }}
          aria-label="Previous style"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="carousel-view">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(calc(-100% * ${activeIndex}))`,
          }}
        >
          {/* Month Grid */}
          <div className="carousel-slide">
            <MonthView
              year={currentYear}
              month={currentMonth}
              weekStartsOn={settings.weekStartsOn}
              showWeekNumbers={settings.showWeekNumbers}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
            />
          </div>

          {/* Weekly Agenda */}
          <div className="carousel-slide">
            <WeeklyAgenda weekStartsOn={settings.weekStartsOn} />
          </div>

          {/* Year Overview */}
          <div className="carousel-slide">
            <YearView
              year={currentYear}
              currentMonth={currentMonth}
              weekStartsOn={settings.weekStartsOn}
              onSelectMonth={selectMonth}
              onPrevYear={goToPrevYear}
              onNextYear={goToNextYear}
            />
          </div>
        </div>
      </div>

      {isEditing && (
        <button
          className="carousel-arrow carousel-arrow--right"
          onClick={(e) => {
            e.stopPropagation();
            nextStyle();
          }}
          aria-label="Next style"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {isEditing && (
        <div className="carousel-dots">
          {CALENDAR_STYLES.map((style, idx) => (
            <button
              key={style.id}
              className={`carousel-dot ${idx === activeIndex ? 'carousel-dot--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setStyleIndex(idx);
              }}
              aria-label={`Select ${style.name}`}
            />
          ))}
        </div>
      )}

      {!isEditing && <span className="calendar-hint">long press to customize</span>}
    </div>
  );
}
