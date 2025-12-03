import { h } from 'preact';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import './ColorPicker.css';

// Predefined color palette for text and highlight
const TEXT_COLORS = [
  { name: 'Default', value: null, className: 'color-default' },
  { name: 'Black', value: '#000000', className: 'color-black' },
  { name: 'White', value: '#FFFFFF', className: 'color-white' },
  { name: 'Red', value: '#EF4444', className: 'color-red' },
  { name: 'Orange', value: '#F97316', className: 'color-orange' },
  { name: 'Yellow', value: '#EAB308', className: 'color-yellow' },
  { name: 'Green', value: '#22C55E', className: 'color-green' },
  { name: 'Blue', value: '#3B82F6', className: 'color-blue' },
  { name: 'Purple', value: '#A855F7', className: 'color-purple' },
  { name: 'Pink', value: '#EC4899', className: 'color-pink' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: null, className: 'highlight-none' },
  { name: 'Yellow', value: '#FEF08A', className: 'highlight-yellow' },
  { name: 'Green', value: '#BBF7D0', className: 'highlight-green' },
  { name: 'Blue', value: '#BFDBFE', className: 'highlight-blue' },
  { name: 'Purple', value: '#E9D5FF', className: 'highlight-purple' },
  { name: 'Pink', value: '#FBCFE8', className: 'highlight-pink' },
  { name: 'Orange', value: '#FED7AA', className: 'highlight-orange' },
  { name: 'Red', value: '#FECACA', className: 'highlight-red' },
];

const PORTAL_CONTAINER_ID = 'dropdown-portal';
const MENU_MARGIN_PX = 8;
const CLICK_OUTSIDE_DELAY_MS = 150;

export default function ColorPicker({ type = 'text', currentColor, onColorChange, buttonContent, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const isOpenRef = useRef(false);
  const openedAtRef = useRef(0);
  const touchHandledRef = useRef(false);

  const colors = type === 'highlight' ? HIGHLIGHT_COLORS : TEXT_COLORS;

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + MENU_MARGIN_PX,
        left: rect.left + rect.width / 2,
      });
    }
  }, []);

  const doToggle = useCallback(() => {
    const newOpenState = !isOpenRef.current;
    isOpenRef.current = newOpenState;
    if (newOpenState) {
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
    setTimeout(() => { touchHandledRef.current = false; }, 300);
  }, [doToggle]);

  const handleMouseDown = useCallback((e) => {
    if (touchHandledRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    doToggle();
  }, [doToggle]);

  const closeDropdown = useCallback(() => {
    isOpenRef.current = false;
    setIsOpen(false);
  }, []);

  const handleColorSelect = useCallback((color) => {
    onColorChange(color.value);
    closeDropdown();
  }, [onColorChange, closeDropdown]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const timeSinceOpen = Date.now() - openedAtRef.current;
      if (timeSinceOpen < CLICK_OUTSIDE_DELAY_MS) return;

      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      
      if (isOutsideButton && isOutsideMenu) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchend', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
    };
  }, [isOpen, closeDropdown]);

  // Update position on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updateMenuPosition();

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

  const getPortalContainer = () => {
    if (typeof document === 'undefined') return null;
    
    let container = document.getElementById(PORTAL_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = PORTAL_CONTAINER_ID;
      document.body.appendChild(container);
    }
    return container;
  };

  const portalContainer = getPortalContainer();

  return (
    <div class="color-picker">
      <button 
        ref={buttonRef}
        class="color-picker-toggle" 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={disabled}
        title={type === 'highlight' ? 'Highlight Color' : 'Text Color'}
      >
        {buttonContent}
      </button>
      {isOpen && portalContainer && createPortal(
        <div 
          ref={menuRef}
          class="color-picker-menu"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div class="color-picker-grid">
            {colors.map((color) => (
              <button
                key={color.name}
                class={`color-swatch ${color.className} ${currentColor === color.value ? 'active' : ''}`}
                onClick={() => handleColorSelect(color)}
                onMouseDown={(e) => e.preventDefault()}
                title={color.name}
                style={color.value ? { 
                  backgroundColor: type === 'highlight' ? color.value : 'transparent',
                  color: type === 'text' ? color.value : 'inherit'
                } : {}}
              >
                {type === 'text' && color.value && (
                  <span style={{ color: color.value }}>A</span>
                )}
                {type === 'text' && !color.value && (
                  <span class="default-text">A</span>
                )}
                {type === 'highlight' && !color.value && (
                  <span class="no-highlight">⊘</span>
                )}
              </button>
            ))}
          </div>
        </div>,
        portalContainer
      )}
    </div>
  );
}
