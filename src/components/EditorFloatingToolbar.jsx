import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { useEditor } from '../contexts/EditorContext';
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
  const { activeEditor, selectionState, isToolbarInteractionRef } = useEditor();
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false, opacity: 0, transformY: '-100%' });
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
  const lastActiveEditorRef = useRef(null); // Cache the last known active editor

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
    // Throttle updates with requestAnimationFrame to avoid layout thrashing
    // and ensure we're measuring after a browser paint.
    if (updateFrameRef.current) {
      cancelAnimationFrame(updateFrameRef.current);
    }

    updateFrameRef.current = requestAnimationFrame(() => {
      if (typeof window === 'undefined' || !window.getSelection) return;

      const selection = window.getSelection();
      const toolbarElement = toolbarRef.current;

      // Guard 1: Ensure we have the necessary elements and a selection.
      if (!toolbarElement || !selection || selection.rangeCount === 0) {
        if (position.opacity === 1) setPosition((p) => ({ ...p, opacity: 0 }));
        return;
      }

      // Guard 2: Only show for non-empty text selections to avoid mobile keyboard loops.
      const selectionText = selection.toString() || '';
      if (selectionText.trim().length === 0 && !caretMode) {
        if (position.opacity === 1) setPosition((p) => ({ ...p, opacity: 0 }));
        return;
      }

      const range = selection.getRangeAt(0);
      const selectionRect = range.getBoundingClientRect();
      const toolbarRect = toolbarElement.getBoundingClientRect();

      // Guard 3: Ensure the toolbar is actually rendered with dimensions.
      // This is the key fix for the race condition. Because we are in a RAF callback,
      // the dimensions read here are post-paint and should be accurate.
      if (toolbarRect.width === 0 || toolbarRect.height === 0) {
        if (position.opacity === 1) setPosition((p) => ({ ...p, opacity: 0 }));
        return;
      }

      // Update last active editor if we have one
      if (activeEditor) {
        lastActiveEditorRef.current = activeEditor;
      }

      // Use visualViewport for mobile-first, robust positioning
      const vp = window.visualViewport || {
        width: window.innerWidth,
        height: window.innerHeight,
        pageTop: window.scrollY,
        pageLeft: window.scrollX,
      };

      const GAP = 10;
      const VIEWPORT_PADDING = 8;

      // --- POSITIONING LOGIC ---

      // 1. Calculate vertical position (top) and determine transform Y value
      let top;
      let transformY = '-100%';
      const spaceAbove = selectionRect.top;
      const spaceBelow = vp.height - selectionRect.bottom;

      // Prefer to position above, unless there's not enough space OR significantly more space below
      if (spaceAbove > toolbarRect.height + GAP || spaceAbove > spaceBelow) {
        top = vp.pageTop + selectionRect.top - GAP;
        transformY = '-100%';
      } else {
        top = vp.pageTop + selectionRect.bottom + GAP;
        transformY = '0%';
      }

      // 2. Calculate horizontal position (left) based on selection midpoint
      let left = vp.pageLeft + selectionRect.left + (selectionRect.width / 2);

      // --- VIEWPORT CLAMPING ---

      // Clamp the final position to prevent the toolbar from overflowing the viewport.
      const minLeft = vp.pageLeft + VIEWPORT_PADDING;
      const maxLeft = vp.pageLeft + vp.width - toolbarRect.width - VIEWPORT_PADDING;

      // We calculate the left offset based on the centered-by-default transform.
      let clampedLeft = left - (toolbarRect.width / 2);
      clampedLeft = Math.max(minLeft, Math.min(clampedLeft, maxLeft));

      // To keep the CSS simple, we adjust the `left` property and keep the transform.
      left = clampedLeft + (toolbarRect.width / 2);

      // --- LOGGING ---
      if (debugMode) {
        console.log(
          `[TBar Pos] sel(t:${Math.round(selectionRect.top)}, l:${Math.round(selectionRect.left)}, w:${Math.round(selectionRect.width)}, h:${Math.round(selectionRect.height)}) ` +
          `| tbar(w:${Math.round(toolbarRect.width)}, h:${Math.round(toolbarRect.height)}) ` +
          `| vp(w:${Math.round(vp.width)}, h:${Math.round(vp.height)}, pT:${Math.round(vp.pageTop)}, pL:${Math.round(vp.pageLeft)}) ` +
          `| final(t:${Math.round(top)}, l:${Math.round(left)}, tY:${transformY})`
        );
      }

      setPosition({ top, left, transformY, opacity: 1 });
    });
  }, [position.opacity, caretMode, debugMode, activeEditor]);

  // Set up event listeners
  useEffect(() => {
    // The updatePosition function now has requestAnimationFrame throttling built-in,
    // so it can be used directly as the event handler.
    const updateFn = updatePosition;
    console.log(`[EditorFloatingToolbar] Setting up event listeners`);

    document.addEventListener('selectionchange', updateFn);
    window.addEventListener('scroll', updateFn, { capture: true });
    window.addEventListener('resize', updateFn);

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
  }, [updatePosition]);

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

  const handleToolbarInteraction = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isToolbarInteractionRef) {
      isToolbarInteractionRef.current = true;
      console.log('[EditorFloatingToolbar] Toolbar interaction START.');
      // After a short delay, reset the ref. This allows the blur event to
      // proceed as normal if the user clicks away from the editor after
      // interacting with the toolbar.
      setTimeout(() => {
        if (isToolbarInteractionRef) {
          isToolbarInteractionRef.current = false;
          console.log('[EditorFloatingToolbar] Toolbar interaction END.');
        }
      }, 300);
    }
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

  const getEditor = () => activeEditor || lastActiveEditorRef.current;

  const handleHeadingCycle = () => {
    const editor = getEditor();
    if (!editor) return;
    const current = selectionState?.blockType || 'paragraph';
    const sequence = ['paragraph', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const currentIndex = sequence.indexOf(current);
    const nextType = sequence[(currentIndex + 1) % sequence.length];
    editor.toggleHeading?.(nextType === 'paragraph' ? null : nextType);
  };

  const handleListCycle = () => {
    const editor = getEditor();
    if (!editor) return;
    const current = selectionState?.blockType;
    if (current === 'ul') {
      editor.toggleList?.('ol'); // From UL to OL
    } else if (current === 'ol') {
      editor.toggleList?.(null); // From OL to no list
    } else {
      editor.toggleList?.('ul'); // From anything else to UL
    }
  };

  return createPortal(
    <div
      ref={toolbarRef}
      className="floating-toolbar-container"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: position.opacity,
        visibility: position.opacity === 1 ? 'visible' : 'hidden',
        pointerEvents: position.opacity === 1 ? 'auto' : 'none',
        transform: `translate(-50%, ${position.transformY || '-100%'})`,
        transition: 'opacity 0.15s ease-in-out',
      }}
    >
      <div
        className="floating-toolbar"
        onPointerDown={handleToolbarInteraction}
      >
        {/* Reordered buttons for priority */}
        <button
          onClick={() => {
            const editor = getEditor();
            console.log('[EditorFloatingToolbar] Bold button clicked, has editor:', !!editor);
            if (editor) {
              editor.toggleBold();
              editor.focus();
            } else {
              console.warn('[EditorFloatingToolbar] No active editor for Bold action');
            }
          }}
          className={selectionState?.isBold ? 'active' : ''}
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => {
            const editor = getEditor();
            console.log('[EditorFloatingToolbar] Italic button clicked, has editor:', !!editor);
            if (editor) {
              editor.toggleItalic();
              editor.focus();
            } else {
              console.warn('[EditorFloatingToolbar] No active editor for Italic action');
            }
          }}
          className={selectionState?.isItalic ? 'active' : ''}
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => {
            const editor = getEditor();
            console.log('[EditorFloatingToolbar] List cycle button clicked, has editor:', !!editor);
            if (editor) {
              handleListCycle();
              editor.focus();
            } else {
              console.warn('[EditorFloatingToolbar] No active editor for List cycle action');
            }
          }}
          className={selectionState?.blockType === 'ul' || selectionState?.blockType === 'ol' ? 'active' : ''}
          title="Cycle List (UL/OL/Off)"
          aria-label="Cycle List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => {
            const editor = getEditor();
            console.log('[EditorFloatingToolbar] Heading cycle button clicked, has editor:', !!editor);
            if (editor) {
              handleHeadingCycle();
              editor.focus();
            } else {
              console.warn('[EditorFloatingToolbar] No active editor for Heading cycle action');
            }
          }}
          className={selectionState?.blockType?.startsWith('h') ? 'active' : ''}
          title="Cycle Heading (H2-H6)"
          aria-label="Cycle Heading"
        >
          <Type size={18} />
        </button>

        <div class="toolbar-divider"></div>

        <button
          onClick={() => {
            const editor = getEditor();
            console.log('[EditorFloatingToolbar] Link button clicked, has editor:', !!editor);
            if (!editor) {
              console.warn('[EditorFloatingToolbar] No active editor for Link action');
              return;
            }
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.insertLink?.(url);
            }
            editor.focus();
          }}
          className={selectionState?.isLink ? 'active' : ''}
          title="Insert Link"
          aria-label="Insert Link"
        >
          <Link size={18} />
        </button>

        <div class="toolbar-divider"></div>

        <button
          onClick={() => {
            const editor = getEditor();
            if (editor) {
              editor.toggleUnderline();
              editor.focus();
            }
          }}
          className={selectionState?.isUnderline ? 'active' : ''}
          title="Underline"
          aria-label="Underline"
        >
          <Underline size={18} />
        </button>
        <button
          onClick={() => {
            const editor = getEditor();
            if (editor) {
              editor.toggleStrikethrough();
              editor.focus();
            }
          }}
          className={selectionState?.isStrikethrough ? 'active' : ''}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>
        <button
          onClick={() => {
            const editor = getEditor();
            if (editor) {
              editor.toggleCode();
              editor.focus();
            }
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
            onClick={() => {
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
                    onClick={() => {
                      const editor = getEditor();
                      if (editor) {
                        editor.setTextColor(color);
                        editor.focus();
                      }
                      setShowColorPicker(false);
                    }}
                    title={color}
                    aria-label={`Text color ${color}`}
                  />
                ))}
              </div>
              <button
                class="toolbar-dropdown-item"
                onClick={() => {
                  const editor = getEditor();
                  if (editor) {
                    editor.setTextColor(null);
                    editor.focus();
                  }
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
            onClick={() => {
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
                    onClick={() => {
                      const editor = getEditor();
                      if (editor) {
                        editor.setHighlightColor(color);
                        editor.focus();
                      }
                      setShowHighlightPicker(false);
                    }}
                    title={color}
                    aria-label={`Highlight color ${color}`}
                  />
                ))}
              </div>
              <button
                class="toolbar-dropdown-item"
                onClick={() => {
                  const editor = getEditor();
                  if (editor) {
                    editor.setHighlightColor(null);
                    editor.focus();
                  }
                  setShowHighlightPicker(false);
                }}
              >
                Remove highlight
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            const editor = getEditor();
            if (editor) {
              editor.clearFormatting();
              editor.focus();
            }
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
