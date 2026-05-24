import { useState, useCallback } from 'react';
import { AnalogClock } from './AnalogClock';
import { StackedDigitalClock, RetroDigitalClock } from './DigitalClockFaces';
import { useLongPress } from '../../hooks/useLongPress';
import { useSettings } from '../../hooks/useSettings';
import type { TimeState, ClockStyleMode } from '../../types';
import './Clock.css';

interface ClockContainerProps {
  time: TimeState;
}

const CLOCK_STYLES: { id: ClockStyleMode; name: string }[] = [
  { id: 'classic-analog', name: 'Classic Analog' },
  { id: 'minimalist-analog', name: 'Minimalist Analog' },
  { id: 'chronograph', name: 'Chronograph' },
  { id: 'stacked-digital', name: 'Stacked Digital' },
  { id: 'retro-digital', name: 'Retro Digital' },
];

/**
 * Clock container that manages interactive style selection.
 * Long press to enter edit mode, then swipe or use controls to cycle watch faces.
 */
export function ClockContainer({ time }: ClockContainerProps) {
  const { settings, updateSetting } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);

  const activeStyle = settings.clockStyle || 'classic-analog';
  const activeIndex = CLOCK_STYLES.findIndex((s) => s.id === activeStyle);

  const setStyleIndex = useCallback((index: number) => {
    const nextStyle = CLOCK_STYLES[index].id;
    updateSetting('clockStyle', nextStyle);

    // Sync legacy clockMode for general layout properties if needed
    const nextMode = (nextStyle === 'stacked-digital' || nextStyle === 'retro-digital') ? 'digital' : 'analog';
    updateSetting('clockMode', nextMode);
  }, [updateSetting]);

  const nextStyle = useCallback(() => {
    const nextIdx = (activeIndex + 1) % CLOCK_STYLES.length;
    setStyleIndex(nextIdx);
  }, [activeIndex, setStyleIndex]);

  const prevStyle = useCallback(() => {
    const nextIdx = (activeIndex - 1 + CLOCK_STYLES.length) % CLOCK_STYLES.length;
    setStyleIndex(nextIdx);
  }, [activeIndex, setStyleIndex]);

  // Long-press toggles Edit Mode
  const triggerEditMode = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  const longPressHandlers = useLongPress({
    onLongPress: triggerEditMode,
    threshold: 600,
  });

  // Swipe & drag detection for carousel selection
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
        // Fallback for touch cancellation/ends without changedTouches
        longPressHandlers.onTouchEnd(e as any);
      } else {
        longPressHandlers.onMouseUp();
      }
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isEditing) {
      const target = e.target as HTMLElement;
      // Exit editing mode if clicking backdrop/empty space
      if (!target.closest('.carousel-arrow') && !target.closest('.carousel-dot')) {
        setIsEditing(false);
      }
    }
  };

  return (
    <div
      className={`clock-container ${isEditing ? 'widget-container--editing' : ''}`}
      id="clock-widget"
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
          <span className="widget-editing-header__title">{CLOCK_STYLES[activeIndex].name}</span>
          <span className="widget-editing-header__subtitle">Swipe or tap arrows · Tap face to select</span>
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
          {/* Classic Analog */}
          <div className="carousel-slide">
            <AnalogClock
              time={time}
              clockStyle="classic-analog"
              clockNumbers={settings.clockNumbers}
              showSecondsHand={settings.showSecondsHand}
              tickDensity={settings.tickDensity}
            />
          </div>

          {/* Minimalist Analog */}
          <div className="carousel-slide">
            <AnalogClock
              time={time}
              clockStyle="minimalist-analog"
              clockNumbers={settings.clockNumbers}
              showSecondsHand={settings.showSecondsHand}
              tickDensity={settings.tickDensity}
            />
          </div>

          {/* Chronograph */}
          <div className="carousel-slide">
            <AnalogClock
              time={time}
              clockStyle="chronograph"
              clockNumbers={settings.clockNumbers}
              showSecondsHand={settings.showSecondsHand}
              tickDensity={settings.tickDensity}
            />
          </div>

          {/* Stacked Digital */}
          <div className="carousel-slide">
            <StackedDigitalClock time={time} format={settings.timeFormat} />
          </div>

          {/* Retro Digital */}
          <div className="carousel-slide">
            <RetroDigitalClock time={time} format={settings.timeFormat} />
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
          {CLOCK_STYLES.map((style, idx) => (
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

      {!isEditing && <span className="clock-hint">long press to customize</span>}
    </div>
  );
}
