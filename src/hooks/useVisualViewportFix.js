import { useEffect } from 'preact/hooks';

// Constants
const DEFAULT_TOP_POSITION = '0px';
const DEBUG_MODE = false; // Set to true for debugging viewport issues

/**
 * Custom hook to fix header positioning on iOS Safari when keyboard opens.
 * 
 * iOS Safari has a quirk where position: fixed elements don't stay fixed
 * when the virtual keyboard opens. This is because iOS resizes the layout
 * viewport, but the keyboard overlays the visual viewport.
 * 
 * The solution is to use the visualViewport API to dynamically adjust
 * the header's top position to compensate for the viewport offset.
 * 
 * @param {Object} headerRef - React ref to the header element
 */
export function useVisualViewportFix(headerRef) {
  useEffect(() => {
    // Check if visualViewport API is available
    if (!window.visualViewport || !headerRef.current) {
      if (DEBUG_MODE) {
        console.log('[useVisualViewportFix] visualViewport API not available or header ref not set');
      }
      return;
    }

    const header = headerRef.current;
    
    const handleViewportChange = () => {
      // The offset from top of layout viewport to top of visual viewport
      // This is positive when keyboard pushes viewport up
      const offsetTop = window.visualViewport.offsetTop;
      
      if (DEBUG_MODE) {
        console.log('[useVisualViewportFix] Viewport change detected:', {
          offsetTop,
          visualViewportHeight: window.visualViewport.height,
          layoutViewportHeight: window.innerHeight
        });
      }
      
      // Pin header to visual viewport top
      // This keeps the header visible even when keyboard opens
      header.style.top = `${offsetTop}px`;
    };

    if (DEBUG_MODE) {
      console.log('[useVisualViewportFix] Setting up visualViewport listeners');
    }

    // Listen to both resize (keyboard open/close) and scroll (user scrolls while keyboard is open)
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    
    // Initial call to set correct position
    handleViewportChange();

    return () => {
      if (DEBUG_MODE) {
        console.log('[useVisualViewportFix] Cleaning up visualViewport listeners');
      }
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
      // Reset on cleanup
      header.style.top = DEFAULT_TOP_POSITION;
    };
  }, [headerRef]);
}
