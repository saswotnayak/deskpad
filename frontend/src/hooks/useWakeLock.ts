import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that uses the Screen Wake Lock API to prevent the device from sleeping.
 * Automatically re-acquires the lock when the page becomes visible again.
 * Falls back gracefully on unsupported browsers (Fully Kiosk handles this natively).
 */
export function useWakeLock(): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');

      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch (err) {
      // Wake lock request failed — device might be low on battery
      console.warn('Wake Lock request failed:', err);
    }
  }, []);

  useEffect(() => {
    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [requestWakeLock]);
}
