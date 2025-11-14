// easy-seo/src/hooks/useAutosave.js
import { useEffect, useRef, useCallback } from 'preact/hooks';

export const useAutosave = ({ onSave, data, debounceMs = 1500, debugLabel = 'autosave' }) => {
  const timeoutRef = useRef(null);
  const dataRef = useRef(data);

  // Keep a ref to the latest data to avoid re-triggering the effect
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const scheduleSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log(`[${debugLabel}] scheduleSave - reset timer`);
    } else {
      console.log(`[${debugLabel}] scheduleSave - start timer`);
    }

    timeoutRef.current = setTimeout(() => {
      console.log(`[${debugLabel}] autosave start`);
      if (onSave) {
        onSave(dataRef.current);
      }
      timeoutRef.current = null;
    }, debounceMs);
  }, [onSave, debounceMs, debugLabel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return scheduleSave;
};
