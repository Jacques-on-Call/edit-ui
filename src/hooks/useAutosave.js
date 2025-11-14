// easy-seo/src/hooks/useAutosave.js
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';

/**
 * A custom hook for debounced autosaving.
 * @param {function} onSave - The async function to call on save.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {{scheduleSave: function, isSaving: boolean, cancel: function}}
 */
export const useAutosave = (onSave, delay = 1500) => {
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);
  const onSaveRef = useRef(onSave);

  // Keep the onSave callback fresh without re-triggering effects.
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Cleanup timer on unmount. This is critical.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        console.log('[autosave] cleanup - clearing timer');
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const runSave = useCallback(async (...args) => {
    setIsSaving(true);
    try {
      await onSaveRef.current(...args);
    } catch (error) {
      console.error('[autosave] onSave callback failed:', error);
      // Let the caller handle UI feedback for the error.
    } finally {
      setIsSaving(false);
    }
  }, []);

  const scheduleSave = useCallback((...args) => {
    // Clear any existing timer to reset the debounce period.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      console.log('[autosave] scheduleSave - reset timer');
    }

    console.log('[autosave] scheduleSave - start timer');
    timerRef.current = setTimeout(() => {
      runSave(...args);
    }, delay);
  }, [delay, runSave]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      console.log('[autosave] save cancelled');
    }
  }, []);

  return { scheduleSave, isSaving, cancel };
};
