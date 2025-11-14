// easy-seo/src/hooks/useAutosave.js
import { useEffect, useRef, useCallback, useState } from 'preact/hooks';

export default function useAutosave({ onSave, delay = 1500, debugLabel = 'autosave' }) {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);
  const dataRef = useRef(null);

  const scheduleSave = useCallback((payload) => {
    dataRef.current = payload;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log(`[${debugLabel}] scheduleSave - reset timer`);
    } else {
      console.log(`[${debugLabel}] scheduleSave - start timer`);
    }

    timeoutRef.current = setTimeout(async () => {
      console.log(`[${debugLabel}] autosave start`);
      setIsSaving(true);
      try {
        if (onSave) {
          await onSave(dataRef.current);
        }
      } catch (err) {
        console.error(`[${debugLabel}] onSave error:`, err);
      } finally {
        setIsSaving(false);
        timeoutRef.current = null;
      }
    }, delay);
  }, [onSave, delay, debugLabel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { scheduleSave, isSaving };
}
