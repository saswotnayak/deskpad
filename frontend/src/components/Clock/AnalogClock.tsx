import { useMemo } from 'react';
import type { TimeState, ClockNumbersMode, TickDensityMode, ClockStyleMode } from '../../types';
import './Clock.css';

interface AnalogClockProps {
  time: TimeState;
  clockStyle: ClockStyleMode;
  clockNumbers: ClockNumbersMode;
  showSecondsHand: boolean;
  tickDensity: TickDensityMode;
}

/**
 * Analog clock face supporting multiple styles:
 * - Classic Analog: customizable ticks, numbers, and seconds hand.
 * - Minimalist Analog: ultra-thin elegant hands, no ticks, no numbers.
 * - Chronograph: high-density dial, multi-ring design, with custom active sub-dials.
 */
export function AnalogClock({
  time,
  clockStyle,
  clockNumbers,
  showSecondsHand,
  tickDensity,
}: AnalogClockProps) {
  const { hours, minutes, seconds } = time;

  // Derive settings based on selected clock style
  const isMinimalist = clockStyle === 'minimalist-analog';
  const isChronograph = clockStyle === 'chronograph';

  const numbersMode: ClockNumbersMode = isMinimalist ? 'none' : isChronograph ? 'all' : clockNumbers;
  const ticksMode: TickDensityMode = isMinimalist ? 'none' : isChronograph ? 'all' : tickDensity;
  const renderSeconds = isMinimalist ? false : isChronograph ? true : showSecondsHand;

  // Hand rotations
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  // Chronograph sub-dials
  const chronographSubdials = useMemo(() => {
    if (!isChronograph) return null;

    // Subdial rotations
    const sub24hDeg = (hours % 24) * 15 + minutes * 0.25; // 360 / 24 = 15 deg per hour
    const subSecsDeg = seconds * 6;

    return (
      <>
        {/* Top Subdial: 60-second sweep */}
        <div className="chrono-subdial chrono-subdial--top">
          <div className="chrono-subdial__ring" />
          <div className="chrono-subdial__ticks" />
          <div className="chrono-subdial__labels">
            <span>60</span>
            <span>30</span>
          </div>
          <div
            className="chrono-subdial__hand"
            style={{ transform: `rotate(${subSecsDeg}deg)` }}
          />
          <div className="chrono-subdial__center" />
        </div>

        {/* Bottom Subdial: 24-hour layout */}
        <div className="chrono-subdial chrono-subdial--bottom">
          <div className="chrono-subdial__ring" />
          <div className="chrono-subdial__ticks" />
          <div className="chrono-subdial__labels">
            <span>24</span>
            <span>12</span>
          </div>
          <div
            className="chrono-subdial__hand"
            style={{ transform: `rotate(${sub24hDeg}deg)` }}
          />
          <div className="chrono-subdial__center" />
        </div>
      </>
    );
  }, [isChronograph, hours, minutes, seconds]);

  // Generate tick marks
  const ticks = useMemo(() => {
    if (ticksMode === 'none') return [];

    const items = [];
    const step = ticksMode === 'major' ? 5 : 1;
    for (let i = 0; i < 60; i += step) {
      items.push(
        <div
          key={i}
          className={`analog-clock__tick ${i % 5 === 0 ? 'analog-clock__tick--major' : ''} ${
            isChronograph && i % 5 !== 0 ? 'analog-clock__tick--sub' : ''
          }`}
          style={{ transform: `rotate(${i * 6}deg)` }}
        />
      );
    }
    return items;
  }, [ticksMode, isChronograph]);

  // Generate numbers
  const faceNumbers = useMemo(() => {
    if (numbersMode === 'none') return [];

    const numbers = numbersMode === 'accents' ? [12, 3, 6, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return numbers.map((num) => {
      const angle = ((num * 30 - 90) * Math.PI) / 180;
      // Chronograph pushes numbers in slightly to fit double track
      const radiusPercent = isChronograph ? 33 : 37;
      const x = 50 + radiusPercent * Math.cos(angle);
      const y = 50 + radiusPercent * Math.sin(angle);

      return (
        <div
          key={num}
          className={`analog-clock__number ${
            numbersMode === 'accents' ? 'analog-clock__number--accent' : ''
          } ${isChronograph ? 'analog-clock__number--chrono' : ''}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
          }}
        >
          {num}
        </div>
      );
    });
  }, [numbersMode, isChronograph]);

  // Combined style classes
  const clockClasses = [
    'analog-clock',
    `analog-clock--${clockStyle}`,
  ].join(' ');

  return (
    <div className={clockClasses} role="img" aria-label={`Clock showing ${hours}:${minutes.toString().padStart(2, '0')}`}>
      <div className="analog-clock__glow" />
      <div className="analog-clock__ticks">{ticks}</div>
      <div className="analog-clock__numbers">{faceNumbers}</div>

      {/* Chronograph decorations */}
      {chronographSubdials}

      {/* Hour hand */}
      <div
        className="analog-clock__hand analog-clock__hand--hour"
        style={{ transform: `rotate(${hourDeg}deg)` }}
      />

      {/* Minute hand */}
      <div
        className="analog-clock__hand analog-clock__hand--minute"
        style={{ transform: `rotate(${minuteDeg}deg)` }}
      />

      {/* Second hand */}
      {renderSeconds && (
        <div
          className="analog-clock__hand analog-clock__hand--second"
          style={{ transform: `rotate(${secondDeg}deg)` }}
        />
      )}

      {/* Center dot */}
      <div className="analog-clock__center" />
    </div>
  );
}
