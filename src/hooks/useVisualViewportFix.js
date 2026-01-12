import { useEffect } from 'preact/hooks';

// Constants
const DEFAULT_TOP_POSITION = '0px';
const DEBUG_MODE = false; // Set to true for debugging viewport issues

/**
 * Custom hook to adjust a fixed-position element (like a toolbar) to respect
 * the virtual keyboard on mobile devices.
 * 
 * It adjusts the `top` position of the main rail and, more importantly, sets the
 * `max-height` of the scrollable area to prevent it from being hidden by the keyboard.
 * 
 * @param {Object} railRef - React ref to the main toolbar container.
 * @param {Object} scrollAreaRef - React ref to the scrollable inner container.
 */
export function useVisualViewportFix(railRef, scrollAreaRef) {
  useEffect(() => {
    if (!window.visualViewport || !railRef.current || !scrollAreaRef.current) {
      return;
    }

    const rail = railRef.current;
    const scrollArea = scrollAreaRef.current;
    
    const handleViewportChange = () => {
      const { offsetTop, height } = window.visualViewport;

      // Pin the entire rail to the top of the *visual* viewport.
      // We add the rail's original top offset to maintain its position.
      const railInitialTop = parseInt(getComputedStyle(rail).top, 10);
      rail.style.top = `${offsetTop + railInitialTop}px`;

      // Calculate the available height for the scroll area.
      const availableHeight = height - (offsetTop + railInitialTop) - 80; // 80px for padding and controls
      scrollArea.style.maxHeight = `${availableHeight}px`;
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    handleViewportChange(); // Initial call

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
      // Reset styles on cleanup
      rail.style.top = '';
      scrollArea.style.maxHeight = '';
    };
  }, [railRef, scrollAreaRef]);
}
