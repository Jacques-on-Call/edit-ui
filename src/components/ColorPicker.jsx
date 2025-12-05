import { h } from 'preact';
import { useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Pipette } from 'lucide-preact';
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

// Check if EyeDropper API is supported
const isEyeDropperSupported = () => typeof window !== 'undefined' && 'EyeDropper' in window;

export default function ColorPicker({ type = 'text', currentColor, onColorChange, buttonContent, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [hexInput, setHexInput] = useState('');
  const [hexError, setHexError] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const hexInputRef = useRef(null);
  const isOpenRef = useRef(false);
  const openedAtRef = useRef(0);
  const touchHandledRef = useRef(false);

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

  // Handle EyeDropper API
  const handleEyeDropper = async () => {
    if (!isEyeDropperSupported()) return;
    
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        onColorChange(result.sRGBHex);
        closeDropdown();
      }
    } catch (err) {
      // User cancelled or error occurred - silently ignore
      console.log('[ColorPicker] EyeDropper cancelled or error:', err.message);
    }
  };

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

          {/* Hex Input and EyeDropper Section */}
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
            
            {isEyeDropperSupported() && (
              <button 
                class="eyedropper-btn"
                onClick={handleEyeDropper}
                onMouseDown={(e) => e.preventDefault()}
                title="Pick color from screen"
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
