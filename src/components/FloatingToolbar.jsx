import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Palette, Highlighter, Eraser, ChevronDown
} from 'lucide-preact';
import '../styles/FloatingToolbar.css';

/**
 * FloatingToolbar - Context-aware formatting toolbar that appears above text selection
 * 
 * Features:
 * - Inline formatting: Bold, Italic, Underline, Strikethrough, Inline Code
 * - Block format dropdown: Normal text, H1-H6
 * - Alignment dropdown: Left/Center/Right/Justify
 * - Lists: Unordered and Ordered
 * - Link, Clear Formatting
 * - Formatting extras: Text Color, Highlight Color
 * 
 * Handles edge cases:
 * - Collapsed selections (cursor with no selection)
 * - Selections spanning multiple nodes
 * - Selections inside contenteditable areas
 * - Repositioning on scroll/resize with visualViewport offsets
 * - Preventing selection clearing on toolbar clicks
 * - Checking if selection is within editorRootSelector
 * 
 * Debug mode:
 * - When debugMode=true, logs detailed selection and positioning info to console
 * 
 * Props:
 * - handleAction: (action: string, payload?: any) => void - Handler for toolbar actions
 * - selectionState: object - Current selection state from SelectionStatePlugin
 * - editorRootSelector: string - CSS selector for editor root (default '.editor-root')
 * - offset: { x: number, y: number } - Additional offset for positioning (optional)
 * - debugMode: boolean - Enable detailed console logging (default false)
 */
export default function FloatingToolbar({ 
  handleAction, 
  selectionState, 
  editorRootSelector = '.editor-root',
  offset = { x: 0, y: 10 },
  debugMode = false,
  caretMode = false // Opt-in to show toolbar on caret (collapsed selection), default false to avoid mobile keyboard loops
}) {
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

  useEffect(() => {
    const updatePosition = () => {
      // Defensive check: ensure window.getSelection exists (SSR safety)
      if (typeof window === 'undefined' || !window.getSelection) {
        if (debugMode) {
          console.debug('[FloatingToolbar] window.getSelection not available');
        }
        return;
      }

      const selection = window.getSelection();
      
      // Get selection text to check if non-empty
      const selectionText = selection?.toString() || '';
      const hasTextSelection = selectionText.trim().length > 0;
      
      // Create unique key for this selection to dedupe updates
      const selectionKey = selection?.rangeCount > 0 
        ? `${selection.anchorNode?.nodeName}-${selection.anchorOffset}-${selection.focusNode?.nodeName}-${selection.focusOffset}-${selectionText.length}`
        : null;
      
      // Dedupe: Skip update if selection hasn't changed
      if (selectionKey && selectionKey === lastSelectionKeyRef.current) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Skipping - selection unchanged (dedupe)', { selectionKey });
        }
        return;
      }
      lastSelectionKeyRef.current = selectionKey;
      
      // Create summary object for debugging
      const selectionSummary = {
        isCollapsed: selection?.isCollapsed,
        rangeCount: selection?.rangeCount || 0,
        anchorNode: selection?.anchorNode?.nodeName,
        focusNode: selection?.focusNode?.nodeName,
        selectionText: selectionText.substring(0, 50) + (selectionText.length > 50 ? '...' : ''),
        textLength: selectionText.length,
        trimmedLength: selectionText.trim().length,
        hasTextSelection,
        caretMode
      };

      // Hide toolbar if no selection or selection is collapsed (just a cursor)
      // Exception: if caretMode=true, allow showing on collapsed selection
      if (!selection || selection.rangeCount === 0) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Hiding - no selection or rangeCount=0', selectionSummary);
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Critical mobile fix: Only show toolbar when there's actual text selected
      // This prevents caret loops caused by keyboard/visualViewport events on mobile
      if (selection.isCollapsed && !caretMode) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Hiding - collapsed selection and caretMode=false (prevents mobile keyboard loops)', selectionSummary);
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Only show toolbar when selection has non-empty text (after trim)
      // This prevents showing toolbar on collapsed selection or whitespace-only selection
      if (!hasTextSelection && !caretMode) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Hiding - no text in selection (prevents caret loops)', selectionSummary);
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Edge case: Check if selection is inside a contenteditable element or editor root
      const anchorNode = selection.anchorNode;
      if (!anchorNode) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Hiding - no anchor node');
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Check if selection is within the editor root
      const editorRoot = document.querySelector(editorRootSelector);
      let anchorInEditorRoot = false;
      
      if (editorRoot) {
        let node = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
        while (node && node !== document.body) {
          if (node === editorRoot || (node.classList && node.classList.contains('editor-input'))) {
            anchorInEditorRoot = true;
            break;
          }
          node = node.parentElement;
        }
      }

      if (!anchorInEditorRoot) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Hiding - selection not in editor root', {
            editorRootSelector,
            anchorInEditorRoot,
            checkedElement: anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement?.className : anchorNode.className
          });
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Get bounding rect of the selection range
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      const rect = range.getBoundingClientRect();

      // Hide toolbar if selection has no dimensions (can happen with certain nodes)
      if (rect.width === 0 && rect.height === 0) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Hiding - selection has no dimensions', {
            rectWidth: rect.width,
            rectHeight: rect.height
          });
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const toolbarElement = toolbarRef.current;
      if (!toolbarElement) return;

      // Account for visualViewport offsets (important for mobile/pinch-zoom)
      const viewport = window.visualViewport || { 
        offsetLeft: 0, 
        offsetTop: 0, 
        pageLeft: window.scrollX,
        pageTop: window.scrollY
      };
      
      const viewportOffsetX = viewport.offsetLeft || 0;
      const viewportOffsetY = viewport.offsetTop || 0;

      // Position toolbar above selection, centered horizontally
      // Use absolute positioning with scroll offsets and viewport offsets
      const top = rect.top + window.scrollY - toolbarElement.offsetHeight - offset.y + viewportOffsetY;
      const left = rect.left + window.scrollX + (rect.width / 2) + viewportOffsetX + offset.x;

      if (debugMode) {
        console.debug('[FloatingToolbar] Positioning toolbar', {
          selectionSummary,
          anchorInEditorRoot,
          clientRects: {
            count: rects.length,
            first: rects[0] ? {
              top: rects[0].top,
              left: rects[0].left,
              width: rects[0].width,
              height: rects[0].height
            } : null
          },
          boundingRect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          viewportOffsets: {
            offsetLeft: viewportOffsetX,
            offsetTop: viewportOffsetY,
            pageLeft: viewport.pageLeft || window.scrollX,
            pageTop: viewport.pageTop || window.scrollY
          },
          scrollPosition: {
            scrollX: window.scrollX,
            scrollY: window.scrollY
          },
          computedPosition: {
            top,
            left,
            toolbarHeight: toolbarElement.offsetHeight,
            toolbarWidth: toolbarElement.offsetWidth
          }
        });
      }

      setPosition({ top, left, visible: true });
    };

    const debouncedUpdatePosition = () => {
      // Cancel any pending frame to avoid duplicate updates (rate limiting)
      if (updateFrameRef.current) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      // Schedule update for next frame
      updateFrameRef.current = requestAnimationFrame(updatePosition);
    }

    document.addEventListener('selectionchange', debouncedUpdatePosition);
    window.addEventListener('scroll', debouncedUpdatePosition, { capture: true });
    window.addEventListener('resize', debouncedUpdatePosition);

    return () => {
      // Cancel any pending frame on cleanup
      if (updateFrameRef.current) {
        cancelAnimationFrame(updateFrameRef.current);
      }
      document.removeEventListener('selectionchange', debouncedUpdatePosition);
      window.removeEventListener('scroll', debouncedUpdatePosition, { capture: true });
      window.removeEventListener('resize', debouncedUpdatePosition);
    };
  }, [editorRootSelector, offset, debugMode, caretMode]);

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

  // Prevent mousedown from clearing selection before click handler executes
  // preventDefault: Stops browser's default text selection behavior
  // stopPropagation: Prevents event bubbling to parent elements that might handle clicks differently
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

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

  if (!position.visible) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={handleMouseDown}
    >
        {/* Text formatting group */}
        <div class="toolbar-group">
            <button 
              onClick={() => safeHandleAction('bold')} 
              className={selectionState?.isBold ? 'active' : ''} 
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
                <Bold size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('italic')} 
              className={selectionState?.isItalic ? 'active' : ''} 
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
                <Italic size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('underline')} 
              className={selectionState?.isUnderline ? 'active' : ''} 
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
                <Underline size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('strikethrough')} 
              className={selectionState?.isStrikethrough ? 'active' : ''} 
              title="Strikethrough"
              aria-label="Strikethrough"
            >
                <Strikethrough size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('code')} 
              className={selectionState?.isCode ? 'active' : ''} 
              title="Inline Code"
              aria-label="Inline Code"
            >
                <Code size={18} />
            </button>
        </div>

        <div class="toolbar-divider"></div>

        {/* Block format dropdown */}
        <div class="toolbar-group toolbar-dropdown-container" ref={blockDropdownRef}>
            <button 
              onClick={() => setShowBlockDropdown(!showBlockDropdown)}
              className="toolbar-dropdown-trigger"
              title="Block format"
              aria-label="Block format"
              aria-expanded={showBlockDropdown}
            >
                <Type size={18} />
                <ChevronDown size={14} />
            </button>
            {showBlockDropdown && (
              <div class="toolbar-dropdown">
                {blockFormats.map(format => (
                  <button
                    key={format.value}
                    class={`toolbar-dropdown-item ${currentBlockType === format.value ? 'active' : ''}`}
                    onClick={() => {
                      safeHandleAction('heading', format.value === 'paragraph' ? null : format.value);
                      setShowBlockDropdown(false);
                    }}
                  >
                    <span class="dropdown-item-label">{format.label}</span>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Alignment dropdown */}
        <div class="toolbar-group toolbar-dropdown-container" ref={alignDropdownRef}>
            <button 
              onClick={() => setShowAlignDropdown(!showAlignDropdown)}
              className="toolbar-dropdown-trigger"
              title="Text alignment"
              aria-label="Text alignment"
              aria-expanded={showAlignDropdown}
            >
                <AlignLeft size={18} />
                <ChevronDown size={14} />
            </button>
            {showAlignDropdown && (
              <div class="toolbar-dropdown">
                {alignments.map(align => {
                  const Icon = align.icon;
                  return (
                    <button
                      key={align.value}
                      class={`toolbar-dropdown-item ${currentAlignment === align.value ? 'active' : ''}`}
                      onClick={() => {
                        safeHandleAction('align', align.value);
                        setShowAlignDropdown(false);
                      }}
                    >
                      <Icon size={18} />
                      <span class="dropdown-item-label">{align.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
        </div>

        <div class="toolbar-divider"></div>

        {/* Lists group */}
        <div class="toolbar-group">
            <button 
              onClick={() => safeHandleAction('list', 'ul')} 
              className={selectionState?.blockType === 'ul' ? 'active' : ''} 
              title="Bulleted List"
              aria-label="Bulleted List"
            >
                <List size={18} />
            </button>
            <button 
              onClick={() => safeHandleAction('list', 'ol')} 
              className={selectionState?.blockType === 'ol' ? 'active' : ''} 
              title="Numbered List"
              aria-label="Numbered List"
            >
                <ListOrdered size={18} />
            </button>
        </div>

        <div class="toolbar-divider"></div>

        {/* Link and formatting controls */}
        <div class="toolbar-group">
            <button 
              onClick={() => safeHandleAction('link')} 
              className={selectionState?.isLink ? 'active' : ''} 
              title="Insert Link"
              aria-label="Insert Link"
            >
                <Link size={18} />
            </button>

            {/* Text color picker */}
            <div class="toolbar-dropdown-container" ref={colorPickerRef}>
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
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
                          safeHandleAction('textColor', color);
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
                      safeHandleAction('textColor', null);
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
                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
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
                          safeHandleAction('highlightColor', color);
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
                      safeHandleAction('highlightColor', null);
                      setShowHighlightPicker(false);
                    }}
                  >
                    Remove highlight
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => safeHandleAction('clearFormatting')} 
              title="Clear formatting"
              aria-label="Clear formatting"
            >
                <Eraser size={18} />
            </button>
        </div>

        <div class="toolbar-arrow"></div>
    </div>,
    document.body
  );
}