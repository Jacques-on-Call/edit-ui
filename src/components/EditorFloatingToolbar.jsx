import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useEditor } from '../../contexts/EditorContext';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Palette, Highlighter, Eraser, ChevronDown
} from 'lucide-preact';
import './EditorFloatingToolbar.css';

// iOS viewport positioning constants
const MIN_TOOLBAR_GAP_FROM_VIEWPORT_TOP = 8; // Minimum gap (px) from visual viewport top to keep toolbar visible

/**
 * FloatingToolbar - Icon-only context-aware formatting toolbar with liquid glass theme
 * 
 * Features:
 * - Icon-only buttons (no visible text labels) for compact display
 * - Liquid glass visual theme with backdrop blur and subtle gradients
 * - Inline formatting: Bold, Italic, Underline, Strikethrough, Inline Code
 * - Block format dropdown: Normal text, H1-H6
 * - Alignment dropdown: Left/Center/Right/Justify
 * - Lists: Unordered and Ordered
 * - Link, Clear Formatting
 * - Formatting extras: Text Color, Highlight Color
 * 
 * Anti-Loop Features:
 * - Fixed upward buffer positioning (avoids render-measure circular dependency)
 * - Selection deduplication with configurable cooldown to prevent rapid re-processing
 * - requestAnimationFrame debouncing for position updates
 * - Only shows on non-empty text selection (prevents mobile keyboard loops)
 * 
 * Mobile Support:
 * - touchend event listener for mobile text selection
 * - Prevents mousedown/touch events on toolbar from clearing selection
 * - visualViewport offsets for correct positioning on mobile/zoomed views
 * 
 * Debug Instrumentation:
 * - Runtime logging toggled by window.__EASY_SEO_TOOLBAR_DEBUG__
 * - Detailed selection state, positioning, and hide reason logs
 * 
 * Props:
 * - handleAction: (action: string, payload?: any) => void - Handler for toolbar actions
 * - selectionState: object - Current selection state from SelectionStatePlugin
 * - editorRootSelector: string - CSS selector for editor root (default '.editor-root')
 * - offset: { x: number, y: number } - Additional offset for positioning (optional)
 * - cooldownMs: number - Cooldown period between selection updates (default 200ms)
 * - caretMode: boolean - Show toolbar on collapsed selection (default false)
 */
export default function EditorFloatingToolbar({
  editorRootSelector = '.editor-root',
  offset = { x: 0, y: 10 },
  cooldownMs = 200, // Configurable cooldown to prevent selection loop spam
  caretMode = false // Opt-in to show toolbar on caret (collapsed selection), default false to avoid mobile keyboard loops
}) {
  const { activeEditor, selectionState } = useEditor();
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false });
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const toolbarRef = useRef(null);
  const blockDropdownRef = useRef(null);
  const alignDropdownRef = useRef(null);
  const colorPickerRef = useRef(null);
  const highlightPickerRef = useRef(null);
  const updateFrameRef = useRef(null); // Track pending RAF to avoid duplicate frames
  
  // Use runtime debug flag from window object
  const debugMode = typeof window !== 'undefined' && window.__EASY_SEO_TOOLBAR_DEBUG__;
  
  // Temporary diagnostic mode - always log key events regardless of debug flag
  // IMPORTANT: Set to false after debugging is complete to avoid excessive production logging
  // This is a temporary debugging instrumentation to diagnose iOS Safari issues
  const DIAGNOSTIC_MODE = false;

  // New helper to find the currently active editor root based on selection
  const findEditorRoot = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.matches && node.matches(editorRootSelector)) {
        return node;
      }
      node = node.parentNode;
    }
    return null; // No editor root found in the selection ancestry
  }, [editorRootSelector]);
  
  // Component mount instrumentation - always log regardless of debug mode
  useEffect(() => {
    const editorRoot = findEditorRoot();
    console.log('[EditorFloatingToolbar] Component mounted', {
      editorRootSelector,
      debugMode: window.__EASY_SEO_TOOLBAR_DEBUG__,
      hasEditorRoot: !!editorRoot,
      editorRootInfo: editorRoot ? {
        tagName: editorRoot.tagName,
        className: editorRoot.className,
        id: editorRoot.id
      } : null,
      userAgent: navigator.userAgent, // Logged for debugging purposes only
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
    });
    
    return () => {
      console.log('[EditorFloatingToolbar] Component unmounting');
    };
  }, [findEditorRoot]);
  
  // Verify portal target exists
  useEffect(() => {
    if (DIAGNOSTIC_MODE) {
      console.log('[EditorFloatingToolbar] Portal target check', {
        documentBody: !!document.body,
        portalContainer: document.body?.tagName
      });
    }
  }, []);
  

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !window.getSelection) return;

    const selection = window.getSelection();
    const toolbarElement = toolbarRef.current;

    if (!toolbarElement) {
      return;
    }

    const selectionText = selection?.toString() || '';
    const hasTextSelection = selectionText.trim().length > 0;

    if (!selection || selection.rangeCount === 0 || !hasTextSelection) {
      if (position.visible) {
        setPosition({ top: 0, left: 0, visible: false });
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();
    const toolbarRect = toolbarElement.getBoundingClientRect();

    // Critical guard: if toolbar has no width, it's not rendered yet.
    // This is a common cause of left-alignment bugs.
    if (toolbarRect.width === 0) {
      // Optional: request another frame to try again once it might be rendered.
      // requestAnimationFrame(updatePosition);
      return;
    }

    // Use visualViewport for mobile-first, robust positioning
    const vp = window.visualViewport || {
      width: window.innerWidth,
      height: window.innerHeight,
      pageTop: window.scrollY,
      pageLeft: window.scrollX,
    };

    const GAP = 10; // Gap between selection and toolbar
    const VIEWPORT_PADDING = 8;

    // Decide if toolbar should be above or below
    const spaceAbove = selectionRect.top;
    const spaceBelow = vp.height - selectionRect.bottom;

    let top;
    // Prefer to position above, unless there's not enough space OR significantly more space below
    if (spaceAbove > toolbarRect.height + GAP || spaceAbove > spaceBelow) {
      top = vp.pageTop + selectionRect.top - toolbarRect.height - GAP;
    } else {
      top = vp.pageTop + selectionRect.bottom + GAP;
    }

    // Calculate centered left position
    let left = vp.pageLeft + selectionRect.left + (selectionRect.width / 2) - (toolbarRect.width / 2);

    // Clamp left position to stay within the viewport
    const minLeft = vp.pageLeft + VIEWPORT_PADDING;
    const maxLeft = vp.pageLeft + vp.width - toolbarRect.width - VIEWPORT_PADDING;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // A log has been added to help with debugging.
    console.log('[EditorFloatingToolbar] updatePosition', {
      selectionRect: { top: selectionRect.top, bottom: selectionRect.bottom, left: selectionRect.left, width: selectionRect.width },
      toolbarRect: { width: toolbarRect.width, height: toolbarRect.height },
      visualViewport: { width: vp.width, height: vp.height, pageTop: vp.pageTop, pageLeft: vp.pageLeft },
      calculatedPosition: { top, left }
    });

    setPosition({ top, left, visible: true });
  }, [position.visible, debugMode]);

  const debouncedUpdatePosition = useCallback(() => {
    // A simple RAF debounce is sufficient for non-iOS devices.
    if (updateFrameRef.current) {
      cancelAnimationFrame(updateFrameRef.current);
    }
    updateFrameRef.current = requestAnimationFrame(updatePosition);
  }, [updatePosition]);

  const debouncedUpdatePositionIos = useCallback(() => {
    // iOS requires a longer delay for the selection to be stable after a touch gesture.
    // 300ms seems to be a reliable value.
    setTimeout(updatePosition, 300);
  }, [updatePosition]);
  
  // Set up event listeners
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const updateFn = isIOS ? debouncedUpdatePositionIos : debouncedUpdatePosition;

    console.log(`[EditorFloatingToolbar] Setting up event listeners (iOS: ${isIOS})`);
    document.addEventListener('selectionchange', updateFn);
    window.addEventListener('scroll', updateFn, { capture: true });
    window.addEventListener('resize', updateFn);

    // Also listen to the visualViewport for resize events, crucial for mobile keyboard
    const vp = window.visualViewport;
    if (vp) {
      vp.addEventListener('resize', updateFn);
    }

    return () => {
      console.log('[EditorFloatingToolbar] Removing event listeners');
      if (updateFrameRef.current) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      document.removeEventListener('selectionchange', updateFn);
      window.removeEventListener('scroll', updateFn, { capture: true });
      window.removeEventListener('resize', updateFn);
      if (vp) {
        vp.removeEventListener('resize', updateFn);
      }
    };
  }, [debouncedUpdatePosition, debouncedUpdatePositionIos]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (blockDropdownRef.current && !blockDropdownRef.current.contains(e.target)) {
        setShowBlockDropdown(false);
      }
      if (alignDropdownRef.current && !alignDropdownRef.current.contains(e.target)) {
        setShowAlignDropdown(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target)) {
        setShowHighlightPicker(false);
      }
    };

    if (showBlockDropdown || showAlignDropdown || showColorPicker || showHighlightPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBlockDropdown, showAlignDropdown, showColorPicker, showHighlightPicker]);

  // Prevent mousedown/touchstart from clearing selection before click handler executes
  // preventDefault: Stops browser's default text selection behavior
  // stopPropagation: Prevents event bubbling to parent elements that might handle clicks differently
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleToolbarTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Actions are now dispatched directly to the active editor instance from the context.

  // Block format options
  const blockFormats = [
    { value: 'paragraph', label: 'Normal text', tag: 'P' },
    { value: 'h1', label: 'Heading 1', tag: 'H1' },
    { value: 'h2', label: 'Heading 2', tag: 'H2' },
    { value: 'h3', label: 'Heading 3', tag: 'H3' },
    { value: 'h4', label: 'Heading 4', tag: 'H4' },
    { value: 'h5', label: 'Heading 5', tag: 'H5' },
    { value: 'h6', label: 'Heading 6', tag: 'H6' },
  ];

  // Alignment options
  const alignments = [
    { value: 'left', label: 'Align Left', icon: AlignLeft },
    { value: 'center', label: 'Align Center', icon: AlignCenter },
    { value: 'right', label: 'Align Right', icon: AlignRight },
    { value: 'justify', label: 'Align Justify', icon: AlignJustify },
  ];

  // Predefined colors for quick selection
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const currentBlockType = selectionState?.blockType || 'paragraph';
  const currentAlignment = selectionState?.alignment || 'left';

  const handleHeadingCycle = () => {
    if (!activeEditor) return;
    const current = selectionState?.blockType || 'paragraph';
    const sequence = ['paragraph', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const currentIndex = sequence.indexOf(current);
    const nextType = sequence[(currentIndex + 1) % sequence.length];
    activeEditor.toggleHeading?.(nextType === 'paragraph' ? null : nextType);
  };

  const handleListCycle = () => {
    if (!activeEditor) return;
    const current = selectionState?.blockType;
    if (current === 'ul') {
      activeEditor.toggleList?.('ol'); // From UL to OL
    } else if (current === 'ol') {
      activeEditor.toggleList?.(null); // From OL to no list
    } else {
      activeEditor.toggleList?.('ul'); // From anything else to UL
    }
  };

  return createPortal(
    <div
      ref={toolbarRef}
      className="floating-toolbar-container"
      style={{
        top: position.visible ? `${position.top}px` : '-1000px',
        left: position.visible ? `${position.left}px` : '-1000px',
        opacity: position.visible ? 1 : 0,
      }}
    >
      <div
        className="floating-toolbar"
        onMouseDown={handleMouseDown}
        onTouchStart={handleToolbarTouchStart}
      >
        {/* Reordered buttons for priority */}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            activeEditor?.toggleBold();
          }}
          className={selectionState?.isBold ? 'active' : ''}
          title="Bold"
          aria-label="Bold"
        >
            <Bold size={18} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            activeEditor?.toggleItalic();
          }}
          className={selectionState?.isItalic ? 'active' : ''}
          title="Italic"
          aria-label="Italic"
        >
            <Italic size={18} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleListCycle();
          }}
          className={selectionState?.blockType === 'ul' || selectionState?.blockType === 'ol' ? 'active' : ''}
          title="Cycle List (UL/OL/Off)"
          aria-label="Cycle List"
        >
            <List size={18} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleHeadingCycle();
          }}
          className={selectionState?.blockType?.startsWith('h') ? 'active' : ''}
          title="Cycle Heading (H2-H6)"
          aria-label="Cycle Heading"
        >
            <Type size={18} />
        </button>

        <div class="toolbar-divider"></div>

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            if (!activeEditor) return;
            const url = window.prompt('Enter URL:');
            if (url) {
              activeEditor.insertLink?.(url);
            }
          }}
          className={selectionState?.isLink ? 'active' : ''}
          title="Insert Link"
          aria-label="Insert Link"
        >
            <Link size={18} />
        </button>

        <div class="toolbar-divider"></div>

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            activeEditor?.toggleUnderline();
          }}
          className={selectionState?.isUnderline ? 'active' : ''}
          title="Underline"
          aria-label="Underline"
        >
            <Underline size={18} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            activeEditor?.toggleStrikethrough();
          }}
          className={selectionState?.isStrikethrough ? 'active' : ''}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
            <Strikethrough size={18} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            activeEditor?.toggleCode();
          }}
          className={selectionState?.isCode ? 'active' : ''}
          title="Inline Code"
          aria-label="Inline Code"
        >
            <Code size={18} />
        </button>

        {/* Text color picker */}
        <div class="toolbar-dropdown-container" ref={colorPickerRef}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
            }}
            className="toolbar-dropdown-trigger"
            title="Text color"
            aria-label="Text color"
            aria-expanded={showColorPicker}
          >
              <Palette size={18} />
          </button>
          {showColorPicker && (
            <div class="toolbar-dropdown color-picker-dropdown">
              <div class="color-grid">
                {colors.map(color => (
                  <button
                    key={color}
                    class="color-swatch"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      activeEditor?.setTextColor(color);
                      setShowColorPicker(false);
                    }}
                    title={color}
                    aria-label={`Text color ${color}`}
                  />
                ))}
              </div>
              <button
                class="toolbar-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  activeEditor?.setTextColor(null);
                  setShowColorPicker(false);
                }}
              >
                Remove color
              </button>
            </div>
          )}
        </div>

        {/* Highlight color picker */}
        <div class="toolbar-dropdown-container" ref={highlightPickerRef}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowHighlightPicker(!showHighlightPicker);
            }}
            className="toolbar-dropdown-trigger"
            title="Highlight color"
            aria-label="Highlight color"
            aria-expanded={showHighlightPicker}
          >
              <Highlighter size={18} />
          </button>
          {showHighlightPicker && (
            <div class="toolbar-dropdown color-picker-dropdown">
              <div class="color-grid">
                {colors.map(color => (
                  <button
                    key={color}
                    class="color-swatch"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      activeEditor?.setHighlightColor(color);
                      setShowHighlightPicker(false);
                    }}
                    title={color}
                    aria-label={`Highlight color ${color}`}
                  />
                ))}
              </div>
              <button
                class="toolbar-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  activeEditor?.setHighlightColor(null);
                  setShowHighlightPicker(false);
                }}
              >
                Remove highlight
              </button>
            </div>
          )}
        </div>

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            activeEditor?.clearFormatting();
          }}
          title="Clear formatting"
          aria-label="Clear formatting"
        >
            <Eraser size={18} />
        </button>

        {/* Debug instrumentation dot - only visible when debug mode is enabled */}
        {debugMode && (
          <div 
            className="floating-toolbar-debug-dot" 
            title="Debug mode active"
            aria-hidden="true"
          />
        )}

        {/* Debug instrumentation dot - only visible when debug mode is enabled */}
        {debugMode && (
          <div
            className="floating-toolbar-debug-dot"
            title="Debug mode active"
            aria-hidden="true"
          />
        )}
      </div>
    </div>,
    document.body
  );
}
