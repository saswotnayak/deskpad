import { useRef, useCallback } from 'react';

interface LongPressOptions {
  /** Duration in ms to trigger long press (default: 600) */
  threshold?: number;
  /** Callback on long press */
  onLongPress: () => void;
  /** Optional callback on normal tap (short press) */
  onTap?: () => void;
}

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

/**
 * Hook for detecting long-press gestures on touch and mouse devices.
 * Returns event handlers to attach to the target element.
 */
export function useLongPress({
  threshold = 600,
  onLongPress,
  onTap,
}: LongPressOptions): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (x: number, y: number) => {
      isLongPressRef.current = false;
      startPosRef.current = { x, y };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    cancel();
    if (!isLongPressRef.current && onTap) {
      onTap();
    }
  }, [cancel, onTap]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    },
    [start]
  );

  const onTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      end();
    },
    [end]
  );

  const onTouchCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseUp = useCallback(() => {
    end();
  }, [end]);

  const onMouseLeave = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  };
}
