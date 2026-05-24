import { useCallback, useEffect } from 'react';

/**
 * Hook that provides fullscreen toggle functionality.
 * Attempts to enter fullscreen on first user interaction.
 */
export function useFullscreen(): { toggleFullscreen: () => void } {
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Fullscreen not supported or denied
      });
    } else {
      document.exitFullscreen?.().catch(() => {
        // Exit failed
      });
    }
  }, []);

  // Auto-enter fullscreen on first touch (for kiosk mode)
  useEffect(() => {
    const handleFirstTouch = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {
          // Silently fail — Fully Kiosk handles this
        });
      }
      document.removeEventListener('touchstart', handleFirstTouch);
    };

    document.addEventListener('touchstart', handleFirstTouch, { once: true });
    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  return { toggleFullscreen };
}
