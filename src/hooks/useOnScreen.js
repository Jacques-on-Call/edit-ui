import { useState, useEffect, useRef } from 'preact/hooks';

/**
 * ⚡ Bolt: On-Screen Visibility Hook
 *
 * This hook uses the Intersection Observer API to detect when a component
 * is visible within the viewport. It's a performance-first approach to
 * lazy-loading components or data, ensuring that expensive operations
 * only run when needed.
 *
 * @param {object} options Intersection Observer options.
 * @returns {[React.MutableRefObject, boolean]} A ref to attach to the element and a boolean indicating visibility.
 */
export function useOnScreen(options) {
  const ref = useRef(null);
  const [isOnScreen, setIsOnScreen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Update our state when the observer callback fires
      setIsOnScreen(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isOnScreen];
}
