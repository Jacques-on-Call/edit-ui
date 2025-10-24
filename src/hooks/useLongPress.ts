import { useRef, useCallback } from 'react';

export function useLongPress(callback: () => void, ms = 350) {
  const timer = useRef<number | null>(null);
  const start = useCallback(() => {
    timer.current = window.setTimeout(() => callback(), ms);
  }, [callback, ms]);
  const clear = useCallback(() => {
    if (timer.current != null) { clearTimeout(timer.current); timer.current = null; }
  }, []);
  return { onTouchStart: start, onTouchEnd: clear, onTouchMove: clear, onMouseDown: start, onMouseUp: clear, onMouseLeave: clear };
}
