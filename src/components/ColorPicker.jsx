import { h } from 'preact';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Pipette, Palette } from 'lucide-preact';
import './ColorPicker.css';

/**
 * Cross-Platform Color Picker Component
 * 
 * This component provides robust color picking across all devices and browsers:
 * 
 * 1. **Color Swatches** - Quick tap/click selection from predefined colors
 * 2. **Hex Input** - Manual hex color entry (#RRGGBB format)
 * 3. **Native Color Input** - HTML5 <input type="color"> fallback for all browsers
 *    - Works on iOS Safari, Android, and all desktop browsers
 *    - Provides the system's native color picker UI
 * 4. **EyeDropper API** - Screen color picking (Chrome/Edge only)
 *    - Uses the browser's native EyeDropper when available
 * 
 * Why this approach?
 * - The EyeDropper API is not supported on iOS Safari or Firefox
 * - The native color input provides a consistent fallback experience
 * - Canva and similar apps use a similar multi-approach strategy
 * 
 * References:
 * - EyeDropper API: https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
 * - HTML5 Color Input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
 */

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
  // Additional colors for more variety
  { name: 'Teal', value: '#14B8A6', className: 'color-teal' },
  { name: 'Indigo', value: '#6366F1', className: 'color-indigo' },
  { name: 'Lime', value: '#84CC16', className: 'color-lime' },
  { name: 'Cyan', value: '#06B6D4', className: 'color-cyan' },
  { name: 'Rose', value: '#F43F5E', className: 'color-rose' },
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
  { name: 'Teal', value: '#99F6E4', className: 'highlight-teal' },
  { name: 'Cyan', value: '#A5F3FC', className: 'highlight-cyan' },
];

const PORTAL_CONTAINER_ID = 'dropdown-portal';
const MENU_MARGIN_PX = 8;
const CLICK_OUTSIDE_DELAY_MS = 150;

// Check if EyeDropper API is supported (Chrome/Edge only, not iOS Safari)
const isEyeDropperSupported = () => typeof window !== 'undefined' && 'EyeDropper' in window;

export default function ColorPicker({ type = 'text', currentColor, onColorChange, buttonContent, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [hexInput, setHexInput] = useState('');
  const [hexError, setHexError] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const hexInputRef = useRef(null);
  const nativeColorInputRef = useRef(null);
  const isOpenRef = useRef(false);
  const openedAtRef = useRef(0);
  const touchHandledRef = useRef(false);
  // Ref to track if we're in the middle of a native color picker session
  const nativePickerActiveRef = useRef(false);

  const colors = type === 'highlight' ? HIGHLIGHT_COLORS : TEXT_COLORS;

  useEffect(() => {
    isOpenRef.current = isOpen;
    // Reset hex input when opening
    if (isOpen) {
      setHexInput(currentColor?.replace('#', '') || '');
      setHexError(false);
    }
  }, [isOpen, currentColor]);

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Calculate available space below and above
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 280; // Approximate menu height
      
      // Position below if there's room, otherwise above
      let top = rect.bottom + MENU_MARGIN_PX;
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        top = rect.top - menuHeight - MENU_MARGIN_PX;
      }
      
      setMenuPosition({
        top: Math.max(MENU_MARGIN_PX, top),
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
    // Don't close if native color picker is active
    if (nativePickerActiveRef.current) return;
    isOpenRef.current = false;
    setIsOpen(false);
  }, []);

  // Handle swatch selection - works for both touch and click
  const handleColorSelect = useCallback((color) => {
    onColorChange(color.value);
    closeDropdown();
  }, [onColorChange, closeDropdown]);

  // Handle hex color input
  const validateHexColor = (hex) => {
    const cleanHex = hex.replace('#', '');
    return /^[0-9A-Fa-f]{6}$/.test(cleanHex) || /^[0-9A-Fa-f]{3}$/.test(cleanHex);
  };

  const handleHexInputChange = (e) => {
    const value = e.target.value.replace('#', '').toUpperCase();
    setHexInput(value);
    setHexError(value.length > 0 && !validateHexColor(value));
  };

  const handleHexSubmit = (e) => {
    e.preventDefault();
    if (validateHexColor(hexInput)) {
      const color = `#${hexInput}`;
      onColorChange(color);
      closeDropdown();
    } else {
      setHexError(true);
    }
  };

  // Handle native HTML5 color input - works on ALL browsers including iOS Safari
  const handleNativeColorInput = useCallback((e) => {
    const color = e.target.value;
    if (color) {
      onColorChange(color.toUpperCase());
      closeDropdown();
    }
  }, [onColorChange, closeDropdown]);

  // Open native color picker
  const openNativeColorPicker = useCallback(() => {
    if (nativeColorInputRef.current) {
      nativePickerActiveRef.current = true;
      nativeColorInputRef.current.click();
      // Reset the flag after a delay to allow the picker to close
      setTimeout(() => {
        nativePickerActiveRef.current = false;
      }, 100);
    }
  }, []);

  // Handle EyeDropper API (Chrome/Edge only)
  const handleEyeDropper = useCallback(async () => {
    if (!isEyeDropperSupported()) return;
    
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        onColorChange(result.sRGBHex.toUpperCase());
        closeDropdown();
      }
    } catch (err) {
      // User cancelled or error occurred - silently ignore
      console.log('[ColorPicker] EyeDropper cancelled or error:', err.message);
    }
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
          {/* Color Grid */}
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

          {/* Hex Input and Color Picker Tools Section */}
          <div class="color-picker-custom">
            <form onSubmit={handleHexSubmit} class="hex-input-form">
              <span class="hex-prefix">#</span>
              <input
                ref={hexInputRef}
                type="text"
                value={hexInput}
                onInput={handleHexInputChange}
                placeholder="HEX"
                maxLength={6}
                class={`hex-input ${hexError ? 'hex-input-error' : ''}`}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
              <button 
                type="submit" 
                class="hex-apply-btn"
                disabled={!validateHexColor(hexInput)}
                title="Apply hex color"
              >
                ✓
              </button>
            </form>
            
            {/* Native color input - works on all browsers including iOS Safari */}
            <div class="native-color-picker-wrapper">
              <input
                ref={nativeColorInputRef}
                type="color"
                value={currentColor || '#3B82F6'}
                onChange={handleNativeColorInput}
                class="native-color-input"
                title="Open system color picker"
              />
              <button 
                class="color-picker-btn"
                onClick={openNativeColorPicker}
                onMouseDown={(e) => e.preventDefault()}
                title="Pick any color (works on all devices)"
              >
                <Palette size={16} />
              </button>
            </div>
            
            {/* EyeDropper - only shown on supported browsers (Chrome/Edge) */}
            {isEyeDropperSupported() && (
              <button 
                class="eyedropper-btn"
                onClick={handleEyeDropper}
                onMouseDown={(e) => e.preventDefault()}
                title="Pick color from screen (Chrome/Edge only)"
              >
                <Pipette size={16} />
              </button>
            )}
          </div>

          {/* Current Color Preview */}
          {currentColor && (
            <div class="current-color-preview">
              <span 
                class="current-color-swatch"
                style={{ backgroundColor: currentColor }}
              />
              <span class="current-color-value">{currentColor}</span>
            </div>
          )}
        </div>,
        portalContainer
      )}
    </div>
  );
}
