import { h } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import './Dropdown.css';

// Constants for dropdown positioning and behavior
const MENU_MARGIN_PX = 8; // Margin below the toggle button
const CLOSE_DELAY_MS = 50; // Delay before closing after option selection
const PORTAL_CONTAINER_ID = 'dropdown-portal';
// Delay before click-outside detection activates (prevents immediate close on touch)
const CLICK_OUTSIDE_DELAY_MS = 150;

export default function Dropdown({ buttonContent, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  // Use ref to track open state to survive re-renders during keyboard resize events
  const isOpenRef = useRef(false);
  // Track when the dropdown was opened to prevent immediate close on mobile
  const openedAtRef = useRef(0);
  // Track if touch event was handled to prevent double-firing
  const touchHandledRef = useRef(false);

  // Sync the ref with state
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position menu centered below the button
      setMenuPosition({
        top: rect.bottom + MENU_MARGIN_PX,
        left: rect.left + rect.width / 2, // center horizontally
      });
    }
  }, []);

  const doToggle = useCallback(() => {
    const newOpenState = !isOpenRef.current;
    isOpenRef.current = newOpenState;
    if (newOpenState) {
      // Record when we opened to prevent immediate close on touch
      openedAtRef.current = Date.now();
    }
    setIsOpen(newOpenState);
    if (newOpenState) {
      updateMenuPosition();
    }
  }, [updateMenuPosition]);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    touchHandledRef.current = true;
    doToggle();
    // Reset touch handled flag after a short delay
    setTimeout(() => { touchHandledRef.current = false; }, 300);
  }, [doToggle]);

  const handleMouseDown = useCallback((e) => {
    // Skip if this was already handled by touch event
    if (touchHandledRef.current) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    doToggle();
  }, [doToggle]);

  const closeDropdown = useCallback(() => {
    isOpenRef.current = false;
    setIsOpen(false);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Ignore clicks that happen immediately after opening (prevents touch event race)
      const timeSinceOpen = Date.now() - openedAtRef.current;
      if (timeSinceOpen < CLICK_OUTSIDE_DELAY_MS) {
        return;
      }

      // Check if click is outside both the button and the menu
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      
      if (isOutsideButton && isOutsideMenu) {
        closeDropdown();
      }
    };

    // Use mousedown for immediate response
    document.addEventListener('mousedown', handleClickOutside, true);
    // Also handle touch events for mobile
    document.addEventListener('touchend', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
    };
  }, [isOpen, closeDropdown]);

  // Update position when window resizes (keyboard appearing/disappearing)
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updateMenuPosition();
    };

    // Listen to both resize and visualViewport changes for mobile keyboard
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isOpen, updateMenuPosition]);

  // Close dropdown when an option is clicked
  const handleMenuClick = useCallback((e) => {
    // Check if a button was clicked (dropdown option)
    if (e.target.closest('button')) {
      // Small delay to allow the action to complete before closing
      setTimeout(closeDropdown, CLOSE_DELAY_MS);
    }
  }, [closeDropdown]);

  // Get the portal container, with fallback handling
  const getPortalContainer = () => {
    if (typeof document === 'undefined') return null;
    
    let container = document.getElementById(PORTAL_CONTAINER_ID);
    if (!container) {
      // Create the portal container if it doesn't exist
      console.warn(`[Dropdown] Portal container '#${PORTAL_CONTAINER_ID}' not found. Creating dynamically.`);
      container = document.createElement('div');
      container.id = PORTAL_CONTAINER_ID;
      document.body.appendChild(container);
    }
    return container;
  };

  const portalContainer = getPortalContainer();

  return (
    <div class="dropdown">
      <button 
        ref={buttonRef}
        class="dropdown-toggle" 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {buttonContent}
      </button>
      {isOpen && portalContainer && createPortal(
        <div 
          ref={menuRef}
          class="dropdown-menu-portal"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
          onClick={handleMenuClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {children}
        </div>,
        portalContainer
      )}
    </div>
  );
}
