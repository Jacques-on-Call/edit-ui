import { useEffect } from 'preact/hooks';

// This hook is now designed to manage multiple fixed elements
// in relation to the visual viewport.

export function useVisualViewportFix(refs) {
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportChange = () => {
      const { offsetTop, height } = window.visualViewport;

      refs.forEach(ref => {
        if (!ref.current) return;

        const element = ref.current;
        const initialTop = parseFloat(element.dataset.initialTop || getComputedStyle(element).top);

        if (isNaN(initialTop)) return;

        // Store the initial top position on the element if not already there
        if (!element.dataset.initialTop) {
          element.dataset.initialTop = initialTop;
        }

        // Pin the element to the top of the visual viewport
        element.style.top = `${offsetTop + initialTop}px`;

        // If this is the scroll area, adjust its max-height
        if (element.classList.contains('rail-scroll-area')) {
          const railTop = parseFloat(element.parentElement.style.top);
          const availableHeight = height - railTop - 20; // 20px buffer
          element.style.maxHeight = `${availableHeight}px`;
        }
      });
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    // Initial call
    handleViewportChange();

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);

      // Reset styles on cleanup
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.style.top = '';
          if (ref.current.classList.contains('rail-scroll-area')) {
            ref.current.style.maxHeight = '';
          }
        }
      });
    };
  }, [refs]);
}
