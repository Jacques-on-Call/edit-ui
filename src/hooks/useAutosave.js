// easy-seo/src/hooks/useAutosave.js
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';

export const useAutosave = (onSave, delay = 1500, debugLabel = 'autosave') => {
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const runSave = useCallback(async (...args) => {
    console.log(`[${debugLabel}] autosave start`);
    setIsSaving(true);
    try {
      await onSaveRef.current(...args);
    } catch (error) {
      console.error(`[${debugLabel}] onSave callback failed:`, error);
    } finally {
      setIsSaving(false);
    }
  }, [debugLabel]);

  const scheduleSave = useCallback((...args) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      console.log(`[${debugLabel}] scheduleSave - reset timer`);
    } else {
      console.log(`[${debugLabel}] scheduleSave - start timer`);
    }

    timerRef.current = setTimeout(() => {
      runSave(...args);
    }, delay);
  }, [delay, runSave, debugLabel]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { scheduleSave, isSaving, cancel };
};
