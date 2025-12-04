import { useRef, useEffect } from 'preact/hooks';

export default function useAutosave(callback, delay = 1000) {
  const latestCallback = useRef(callback);
  const timeoutId = useRef(null);

  useEffect(() => {
    latestCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  const triggerSave = (data) => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      latestCallback.current(data);
    }, delay);
  };

  return { triggerSave };
}
