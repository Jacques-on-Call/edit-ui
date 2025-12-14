import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Palette, Highlighter, Eraser, ChevronDown
} from 'lucide-preact';
import { useEditor } from '../contexts/EditorContext';
import './FloatingToolbar.css';

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
export default function FloatingToolbar({ 
  handleAction, 
  selectionState, 
  editorRootSelector = '.editor-root',
  offset = { x: 0, y: 10 },
  cooldownMs = 200, // Configurable cooldown to prevent selection loop spam
  caretMode = false // Opt-in to show toolbar on caret (collapsed selection), default false to avoid mobile keyboard loops
}) {
  const { isToolbarInteractionRef } = useEditor();
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
  const lastSelectionKeyRef = useRef(null); // Track last selection to dedupe updates
  const updateFrameRef = useRef(null); // Track pending RAF to avoid duplicate frames
  const lastUpdateTimeRef = useRef(0); // Track last update time for cooldown
  const editorRootRef = useRef(null); // Cache editor root element to avoid repeated queries
  const editorRootObserverRef = useRef(null); // MutationObserver for waiting for editor element
  const isTouchActiveRef = useRef(false); // Track iOS touch lifecycle
  const touchEndTimeRef = useRef(0); // Track when touch ended for iOS selection timing
  const iosRetryCountRef = useRef(0); // Track iOS re-check attempts to prevent infinite recursion
  
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
    console.log('[FloatingToolbar] Component mounted', {
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
      console.log('[FloatingToolbar] Component unmounting');
    };
  }, [findEditorRoot]);
  
  // Verify portal target exists
  useEffect(() => {
    if (DIAGNOSTIC_MODE) {
      console.log('[FloatingToolbar] Portal target check', {
        documentBody: !!document.body,
        portalContainer: document.body?.tagName
      });
    }
  }, []);
  

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !window.getSelection) return;

    const selection = window.getSelection();

    const selectionText = selection?.toString() || '';
    const hasTextSelection = selectionText.trim().length > 0;
    if (!selection || selection.rangeCount === 0 || !hasTextSelection) {
      if (position.visible) {
        setPosition({ top: 0, left: 0, visible: false });
      }
      return;
    }

    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) return;

    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();

    const toolbarRect = toolbarElement.getBoundingClientRect();

    // Critical guard: if toolbar has no width, it's not rendered yet.
    // if (toolbarRect.width === 0) return;

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
    if (spaceAbove > toolbarRect.height + GAP || spaceAbove > spaceBelow) {
      // Position above
      top = vp.pageTop + selectionRect.top - toolbarRect.height - GAP;
    } else {
      // Position below
      top = vp.pageTop + selectionRect.bottom + GAP;
    }

    // Calculate centered left position
    let left = vp.pageLeft + selectionRect.left + (selectionRect.width / 2) - (toolbarRect.width / 2);

    // Clamp left position to stay within the viewport
    const minLeft = vp.pageLeft + VIEWPORT_PADDING;
    const maxLeft = vp.pageLeft + vp.width - toolbarRect.width - VIEWPORT_PADDING;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setPosition({ top, left, visible: true });
  }, [position.visible]);

  // Debounced wrapper for updatePosition (Issue #3 fix: use useCallback for stable reference)
  const debouncedUpdatePosition = useCallback(() => {
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: debouncedUpdatePosition called');
      }
      // Cancel any pending frame to avoid duplicate updates (rate limiting)
      if (updateFrameRef.current) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      // Schedule update for next frame
      updateFrameRef.current = requestAnimationFrame(updatePosition);
  }, [DIAGNOSTIC_MODE, updatePosition]);
  
  // iOS-specific: Track touch lifecycle and add delayed selection check
  // Issue #2 fix: Increased delay to 400ms for iOS selection to finalize
  const IOS_SELECTION_DELAY_MS = 400; // iOS Safari requires longer delay for selection to finalize after touch events
  
  const touchStartTimeRef = useRef(0);
  // iOS touch handlers (Issue #3 fix: use useCallback for stable references)
  const handleTouchStart = useCallback(() => {
      isTouchActiveRef.current = true;
      touchStartTimeRef.current = Date.now();
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Touch start - marking touch active');
      }
  }, [DIAGNOSTIC_MODE]);
    
  const handleTouchEndForSelection = useCallback(() => {
      const touchEndTime = Date.now();
      touchEndTimeRef.current = touchEndTime;
      isTouchActiveRef.current = false;
      
      const touchDuration = touchEndTime - touchStartTimeRef.current;

      // Only run the delayed check if the touch was longer than a simple tap
      if (touchDuration > 150) { // If touch is longer than 150ms, it's likely a selection
        if (DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] DIAGNOSTIC: Long touch detected, scheduling selection check.', { touchDuration });
        }
        setTimeout(() => {
          if (DIAGNOSTIC_MODE) {
            console.log('[FloatingToolbar] DIAGNOSTIC: Touch end - checking selection after delay');
          }
          updatePosition();
        }, IOS_SELECTION_DELAY_MS);
      } else {
        if (DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] DIAGNOSTIC: Short tap detected, skipping selection check.', { touchDuration });
        }
      }
  }, [DIAGNOSTIC_MODE, IOS_SELECTION_DELAY_MS, updatePosition]);
    
  // iOS-specific: mouseup event as fallback (Issue #3 fix: use useCallback for stable reference)
  const handleMouseUp = useCallback(() => {
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Mouse up event fired');
      }
      debouncedUpdatePosition();
  }, [DIAGNOSTIC_MODE, debouncedUpdatePosition]);

  // Set up event listeners (Issue #3 fix: stabilized with useCallback handlers)
  useEffect(() => {
    console.log('[FloatingToolbar] Setting up selection listeners and attaching event listeners');
    document.addEventListener('selectionchange', debouncedUpdatePosition);
    window.addEventListener('scroll', debouncedUpdatePosition, { capture: true });
    window.addEventListener('resize', debouncedUpdatePosition);
    // Mobile: touchstart/touchend for tracking iOS selection lifecycle (Issue #2 fix)
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEndForSelection);
    // iOS fallback: mouseup event
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      console.log('[FloatingToolbar] Removing event listeners');
      // Cancel any pending frame on cleanup
      if (updateFrameRef.current) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      document.removeEventListener('selectionchange', debouncedUpdatePosition);
      window.removeEventListener('scroll', debouncedUpdatePosition, { capture: true });
      window.removeEventListener('resize', debouncedUpdatePosition);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEndForSelection);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [debouncedUpdatePosition, handleTouchStart, handleTouchEndForSelection, handleMouseUp]);

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

  // handleMouseDown and handleToolbarTouchStart removed in favor of inline onPointerDown handlers
  // that call e.preventDefault() and e.stopPropagation() directly.

  // Helper to safely call handleAction (reduces duplication and improves readability)
  const safeHandleAction = (action, ...args) => {
    if (handleAction) {
      handleAction(action, ...args);
    } else if (debugMode) {
      // Fallback for testing - use document.execCommand where appropriate
      console.debug('[FloatingToolbar] No handleAction provided, using fallback for:', action);
      try {
        switch (action) {
          case 'bold':
            document.execCommand('bold');
            break;
          case 'italic':
            document.execCommand('italic');
            break;
          case 'underline':
            document.execCommand('underline');
            break;
          case 'strikethrough':
            document.execCommand('strikethrough');
            break;
          case 'undo':
            document.execCommand('undo');
            break;
          case 'redo':
            document.execCommand('redo');
            break;
          default:
            console.debug('[FloatingToolbar] No fallback available for:', action);
        }
      } catch (error) {
        console.debug('[FloatingToolbar] Fallback command failed:', error);
      }
    }
  };

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
    const current = selectionState?.blockType || 'paragraph';
    const sequence = ['paragraph', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const currentIndex = sequence.indexOf(current);
    const nextType = sequence[(currentIndex + 1) % sequence.length];
    safeHandleAction('heading', nextType === 'paragraph' ? null : nextType);
  };

  const handleListCycle = () => {
    const current = selectionState?.blockType;
    if (current === 'ul') {
      safeHandleAction('list', 'ol'); // From UL to OL
    } else if (current === 'ol') {
      safeHandleAction('list', null); // From OL to no list
    } else {
      safeHandleAction('list', 'ul'); // From anything else to UL
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
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        {/* Reordered buttons for priority */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Bold button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('bold');
          }}
          className={selectionState?.isBold ? 'active' : ''}
          title="Bold"
          aria-label="Bold"
        >
            <Bold size={18} />
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Italic button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('italic');
          }}
          className={selectionState?.isItalic ? 'active' : ''}
          title="Italic"
          aria-label="Italic"
        >
            <Italic size={18} />
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: List cycle button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            handleListCycle();
          }}
          className={selectionState?.blockType === 'ul' || selectionState?.blockType === 'ol' ? 'active' : ''}
          title="Cycle List (UL/OL/Off)"
          aria-label="Cycle List"
        >
            <List size={18} />
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Heading cycle button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
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
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Link button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('link');
          }}
          className={selectionState?.isLink ? 'active' : ''}
          title="Insert Link"
          aria-label="Insert Link"
        >
            <Link size={18} />
        </button>

        <div class="toolbar-divider"></div>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Underline button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('underline');
          }}
          className={selectionState?.isUnderline ? 'active' : ''}
          title="Underline"
          aria-label="Underline"
        >
            <Underline size={18} />
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Strikethrough button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('strikethrough');
          }}
          className={selectionState?.isStrikethrough ? 'active' : ''}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
            <Strikethrough size={18} />
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Code button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('code');
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
            onPointerDown={(e) => {
              e.preventDefault();
              if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
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
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                      safeHandleAction('textColor', color);
                      setShowColorPicker(false);
                    }}
                    key={color}
                    class="color-swatch"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Text color ${color}`}
                  />
                ))}
              </div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                  safeHandleAction('textColor', null);
                  setShowColorPicker(false);
                }}
                class="toolbar-dropdown-item"
              >
                Remove color
              </button>
            </div>
          )}
        </div>

        {/* Highlight color picker */}
        <div class="toolbar-dropdown-container" ref={highlightPickerRef}>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
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
                    onPointerDown={(e) => {
                      e.preventDefault();
                      if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                      safeHandleAction('highlightColor', color);
                      setShowHighlightPicker(false);
                    }}
                    key={color}
                    class="color-swatch"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Highlight color ${color}`}
                  />
                ))}
              </div>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                  safeHandleAction('highlightColor', null);
                  setShowHighlightPicker(false);
                }}
                class="toolbar-dropdown-item"
              >
                Remove highlight
              </button>
            </div>
          )}
        </div>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            console.log('[FloatingToolbar] PointerDown: Clear Formatting button');
            if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            safeHandleAction('clearFormatting');
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
