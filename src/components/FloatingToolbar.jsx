import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Palette, Highlighter, Eraser, ChevronDown
} from 'lucide-preact';
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
  const DIAGNOSTIC_MODE = true;

  // Helper function to find editor root with fallback detection (Issue #1 fix)
  // Uses selector first, then falls back to contenteditable attribute
  const findEditorRoot = useCallback(() => {
    // Return cached result if available
    if (editorRootRef.current && document.body.contains(editorRootRef.current)) {
      return editorRootRef.current;
    }
    
    // Try primary selector
    let element = document.querySelector(editorRootSelector);
    
    // Fallback: Find by contenteditable attribute if selector fails
    if (!element) {
      const editables = document.querySelectorAll('[contenteditable="true"]');
      // Prefer elements with editor-related classes
      for (const el of editables) {
        if (el.className && (
          el.className.includes('editor') || 
          el.className.includes('lexical') ||
          el.className.includes('content')
        )) {
          element = el;
          break;
        }
      }
      // If still not found, use first contenteditable
      if (!element && editables.length > 0) {
        element = editables[0];
      }
      
      if (element && DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] Editor root found via contenteditable fallback', {
          selector: editorRootSelector,
          foundElement: {
            tagName: element.tagName,
            className: element.className,
            id: element.id
          }
        });
      }
    }
    
    // Cache the result
    if (element) {
      editorRootRef.current = element;
    }
    
    return element;
  }, [editorRootSelector, DIAGNOSTIC_MODE]);
  
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
  
  // Wait for editor root element to appear in DOM (Issue #1 fix)
  // Uses MutationObserver to detect when the editor element is added
  useEffect(() => {
    const checkEditorRoot = () => {
      const editorRoot = findEditorRoot();
      if (editorRoot) {
        if (DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Editor root found and ready', {
            tagName: editorRoot.tagName,
            className: editorRoot.className
          });
        }
        // Disconnect observer once found
        if (editorRootObserverRef.current) {
          editorRootObserverRef.current.disconnect();
          editorRootObserverRef.current = null;
        }
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (checkEditorRoot()) {
      return;
    }
    
    // If not found, set up MutationObserver to wait for it
    if (DIAGNOSTIC_MODE) {
      console.log('[FloatingToolbar] Editor root not found, setting up MutationObserver');
    }
    
    const observer = new MutationObserver((mutations) => {
      // Performance optimization: Only check when relevant nodes are added
      const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
      if (hasAddedNodes && checkEditorRoot()) {
        if (DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Editor root detected via MutationObserver');
        }
      }
    });
    
    // Observe only the body's direct children to reduce overhead
    // Editor component should be mounted relatively high in the DOM tree
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      // Only observe childList changes (not attributes or characterData) for better performance
      attributes: false,
      characterData: false
    });
    
    editorRootObserverRef.current = observer;
    
    return () => {
      if (editorRootObserverRef.current) {
        editorRootObserverRef.current.disconnect();
        editorRootObserverRef.current = null;
      }
    };
  }, [findEditorRoot, DIAGNOSTIC_MODE]);

  // Main selection position update function (Issue #3 fix: use useCallback for stable reference)
  const updatePosition = useCallback(() => {
      // Always log selection event firing in diagnostic mode
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Selection event fired');
      }
      
      // Defensive check: ensure window.getSelection exists (SSR safety)
      if (typeof window === 'undefined' || !window.getSelection) {
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] window.getSelection not available');
        }
        return;
      }

      const selection = window.getSelection();
      
      // iOS-specific handling (Issue #2 fix)
      // Detect if we're on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Check if we're still within the touch window (touch just ended)
      const now = Date.now();
      const timeSinceTouchEnd = now - touchEndTimeRef.current;
      const isRecentTouch = timeSinceTouchEnd < 500; // Within 500ms of touch end
      
      // Log selection details in diagnostic mode
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Selection object', {
          selection: !!selection,
          isCollapsed: selection?.isCollapsed,
          rangeCount: selection?.rangeCount,
          selectionText: selection?.toString()?.substring(0, 50),
          isIOS,
          isTouchActive: isTouchActiveRef.current,
          isRecentTouch,
          timeSinceTouchEnd
        });
      }
      
      // Get selection text to check if non-empty
      const selectionText = selection?.toString() || '';
      const hasTextSelection = selectionText.trim().length > 0;
      
      // iOS-specific: If selection appears collapsed but we just had a touch,
      // wait a bit longer for iOS to finalize the selection (Issue #2 fix)
      // Add recursion guard to prevent infinite loop if selection never finalizes
      const MAX_IOS_RETRIES = 3;
      if (isIOS && selection?.isCollapsed && isRecentTouch && !caretMode && iosRetryCountRef.current < MAX_IOS_RETRIES) {
        iosRetryCountRef.current += 1;
        if (DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] iOS: Selection collapsed but touch recent, will re-check', {
            timeSinceTouchEnd,
            willReCheckIn: '100ms',
            retryCount: iosRetryCountRef.current,
            maxRetries: MAX_IOS_RETRIES
          });
        }
        // Schedule a re-check after iOS has had time to finalize
        setTimeout(() => {
          if (DIAGNOSTIC_MODE) {
            console.log('[FloatingToolbar] iOS: Re-checking selection after delay');
          }
          updatePosition();
        }, 100);
        return;
      }
      
      // Reset retry count on successful check or when we give up
      if (iosRetryCountRef.current > 0 && (!isRecentTouch || !selection?.isCollapsed)) {
        if (DIAGNOSTIC_MODE && iosRetryCountRef.current >= MAX_IOS_RETRIES) {
          console.log('[FloatingToolbar] iOS: Max retries reached, giving up on collapsed selection');
        }
        iosRetryCountRef.current = 0;
      }
      
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
      
      // Cooldown: Prevent rapid updates within cooldownMs window
      // Reuse 'now' variable already declared above for iOS touch handling
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      if (lastUpdateTimeRef.current > 0 && timeSinceLastUpdate < cooldownMs) {
        if (debugMode) {
          console.debug('[FloatingToolbar] Skipping - within cooldown period', { 
            timeSinceLastUpdate, 
            cooldownMs,
            selectionKey 
          });
        }
        return;
      }
      
      lastSelectionKeyRef.current = selectionKey;
      lastUpdateTimeRef.current = now;
      
      // Create summary object for debugging
      const selectionSummary = {
        isCollapsed: selection?.isCollapsed,
        rangeCount: selection?.rangeCount || 0,
        anchorNode: selection?.anchorNode?.nodeName,
        focusNode: selection?.focusNode?.nodeName,
        selectionText: selectionText.substring(0, 50) + (selectionText.length > 50 ? '...' : ''), // First 50 chars for debugging only
        textLength: selectionText.length,
        trimmedLength: selectionText.trim().length,
        hasTextSelection,
        caretMode
      };

      // Hide toolbar if no selection or selection is collapsed (just a cursor)
      // Exception: if caretMode=true, allow showing on collapsed selection
      if (!selection || selection.rangeCount === 0) {
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Hiding - no selection or rangeCount=0', selectionSummary);
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Critical mobile fix: Only show toolbar when there's actual text selected
      // This prevents caret loops caused by keyboard/visualViewport events on mobile
      if (selection.isCollapsed && !caretMode) {
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Hiding - collapsed selection and caretMode=false (prevents mobile keyboard loops)', selectionSummary);
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Only show toolbar when selection has non-empty text (after trim)
      // This prevents showing toolbar on collapsed selection or whitespace-only selection
      if (!hasTextSelection && !caretMode) {
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Hiding - no text in selection (prevents caret loops)', selectionSummary);
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Edge case: Check if selection is inside a contenteditable element or editor root
      const anchorNode = selection.anchorNode;
      if (!anchorNode) {
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Hiding - no anchor node');
        }
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Check if selection is within the editor root (Issue #1 fix - use findEditorRoot with fallback)
      const editorRoot = findEditorRoot();
      
      // Log editor root check in diagnostic mode
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Editor root check', {
          selector: editorRootSelector,
          found: !!editorRoot,
          elementInfo: editorRoot ? {
            tagName: editorRoot.tagName,
            className: editorRoot.className,
            id: editorRoot.id,
            contentEditable: editorRoot.contentEditable
          } : null
        });
      }
      
      let anchorInEditorRoot = false;
      
      if (editorRoot) {
        let node = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
        while (node && node !== document.body) {
          if (node === editorRoot) {
            anchorInEditorRoot = true;
            break;
          }
          // Also check for contenteditable as additional fallback
          if (node.contentEditable === 'true' || node.isContentEditable) {
            anchorInEditorRoot = true;
            break;
          }
          node = node.parentElement;
        }
      }

      if (!anchorInEditorRoot) {
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Hiding - selection not in editor root', {
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
        if (debugMode || DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] Hiding - selection has no dimensions', {
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
      let top = rect.top + window.scrollY - toolbarElement.offsetHeight - offset.y + viewportOffsetY;
      const left = rect.left + window.scrollX + (rect.width / 2) + viewportOffsetX + offset.x;

      // iOS-specific bounds checking: Prevent toolbar from going off-screen above viewport
      // When selection is near top of screen, the toolbar would render above visible area (negative top)
      const minTopPosition = (viewport.offsetTop || 0) + MIN_TOOLBAR_GAP_FROM_VIEWPORT_TOP;
      const wasAdjusted = top < minTopPosition;
      if (wasAdjusted) {
        top = minTopPosition;
      }

      if (debugMode || DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] Positioning toolbar', {
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
          },
          boundsChecking: {
            minTopPosition,
            wasAdjusted,
            adjustmentReason: wasAdjusted ? 'Toolbar would be off-screen (negative top)' : 'No adjustment needed'
          },
          // iOS-specific debug info
          userAgent: navigator.userAgent,
          isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
          visualViewport: {
            height: viewport.height,
            width: viewport.width,
            offsetTop: viewport.offsetTop,
            offsetLeft: viewport.offsetLeft,
            scale: viewport.scale
          }
        });
      }

      setPosition({ top, left, visible: true });
  }, [debugMode, DIAGNOSTIC_MODE, offset, caretMode, cooldownMs, findEditorRoot]);

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
  
  // iOS touch handlers (Issue #3 fix: use useCallback for stable references)
  const handleTouchStart = useCallback(() => {
      isTouchActiveRef.current = true;
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Touch start - marking touch active');
      }
  }, [DIAGNOSTIC_MODE]);
    
  const handleTouchEndForSelection = useCallback(() => {
      const touchEndTime = Date.now();
      touchEndTimeRef.current = touchEndTime;
      isTouchActiveRef.current = false;
      
      if (DIAGNOSTIC_MODE) {
        console.log('[FloatingToolbar] DIAGNOSTIC: Touch end event fired', {
          touchEndTime,
          delayBeforeCheck: IOS_SELECTION_DELAY_MS
        });
      }
      
      // iOS needs a longer delay for selection to be finalized
      // This gives iOS time to complete the selection gesture and update the Selection API
      setTimeout(() => {
        if (DIAGNOSTIC_MODE) {
          console.log('[FloatingToolbar] DIAGNOSTIC: Touch end - checking selection after delay');
        }
        updatePosition();
      }, IOS_SELECTION_DELAY_MS);
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
      onTouchStart={handleToolbarTouchStart}
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

        {/* Debug instrumentation dot - only visible when debug mode is enabled */}
        {debugMode && (
          <div 
            className="floating-toolbar-debug-dot" 
            title="Debug mode active"
            aria-hidden="true"
          />
        )}

        <div className="toolbar-arrow"></div>
    </div>,
    document.body
  );
}