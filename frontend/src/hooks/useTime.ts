import { useState, useEffect, useRef } from 'react';
import type { TimeState } from '../types';

/**
 * Hook that provides real-time clock state, updating every second.
 * Uses requestAnimationFrame for smooth second-hand transitions
 * and setInterval for reliable 1-second ticks.
 */
export function useTime(): TimeState {
  const [time, setTime] = useState<TimeState>(() => {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      date: now,
    };
  });

  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime({
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        date: now,
      });
    };

    // Sync to the start of the next second for accuracy
    const msUntilNextSecond = 1000 - new Date().getMilliseconds();
    const syncTimeout = setTimeout(() => {
      tick();
      intervalRef.current = setInterval(tick, 1000);
    }, msUntilNextSecond);

    return () => {
      clearTimeout(syncTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return time;
}
