import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import {
    Bold, Italic, Underline, Strikethrough, Code,
    Type, Palette, Highlighter, Eraser, Link, X,
    Heading2, Heading3, Heading4, List, ListOrdered
} from 'lucide-preact';
import { useEditor } from '../contexts/EditorContext';
import './SidePanelToolbar.css';

export default function SidePanelToolbar() {
    const { selectionState, handleAction, isToolbarInteractionRef } = useEditor();
    const [isManualClose, setIsManualClose] = useState(false);
    const panelRef = useRef(null);

    const isOpen = !selectionState.isCollapsed && !isManualClose;

    // Reset manual close when selection collapses
    useEffect(() => {
        if (selectionState.isCollapsed) {
            setIsManualClose(false);
        }
    }, [selectionState.isCollapsed]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && panelRef.current && !panelRef.current.contains(e.target)) {
                // Only close if it's not a click that might be starting a new selection
                // or clicking on the editor itself in a way that should keep the panel open.
                // For simplicity, we'll let the selection state handle most cases,
                // but this allows a manual "dismiss" by clicking elsewhere.
                setIsManualClose(true);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const onAction = (action, payload) => {
        if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
        handleAction(action, payload);
        // We don't necessarily close on action for styling, 
        // as user might want to apply multiple styles.
    };

    const handleHeadingCycle = (e) => {
        e.preventDefault();
        const sequence = ['paragraph', 'h2', 'h3', 'h4'];
        const currentIndex = sequence.indexOf(selectionState.blockType);
        const nextType = sequence[(currentIndex + 1) % sequence.length];
        onAction('heading', nextType === 'paragraph' ? null : nextType);
    };

    const handleListCycle = (e) => {
        e.preventDefault();
        if (selectionState.blockType === 'ul') {
            onAction('list', 'ol');
        } else if (selectionState.blockType === 'ol') {
            onAction('list', null);
        } else {
            onAction('list', 'ul');
        }
    };

    return (
        <div
            ref={panelRef}
            className={`side-panel-toolbar ${isOpen ? 'is-open' : ''}`}
            onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
            }}
        >
            <div className="side-panel-toolbar-header">
                <h4>Styling</h4>
                <button
                    className="side-panel-close-btn"
                    onPointerDown={(e) => {
                        e.preventDefault();
                        setIsManualClose(true);
                    }}
                    aria-label="Close styling panel"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="side-panel-toolbar-group">
                <button
                    className={`side-panel-btn ${selectionState.isBold ? 'active' : ''}`}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onAction('bold');
                    }}
                    title="Bold"
                >
                    <Bold size={18} className="side-panel-btn-icon" />
                    <span>Bold</span>
                </button>
                <button
                    className={`side-panel-btn ${selectionState.isItalic ? 'active' : ''}`}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onAction('italic');
                    }}
                    title="Italic"
                >
                    <Italic size={18} className="side-panel-btn-icon" />
                    <span>Italic</span>
                </button>
                <button
                    className={`side-panel-btn ${selectionState.isUnderline ? 'active' : ''}`}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onAction('underline');
                    }}
                    title="Underline"
                >
                    <Underline size={18} className="side-panel-btn-icon" />
                    <span>Underline</span>
                </button>
                <button
                    className={`side-panel-btn ${selectionState.isStrikethrough ? 'active' : ''}`}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onAction('strikethrough');
                    }}
                    title="Strikethrough"
                >
                    <Strikethrough size={18} className="side-panel-btn-icon" />
                    <span>Strikethrough</span>
                </button>
            </div>

            <div className="side-panel-divider" />

            <div className="side-panel-toolbar-group">
                <button
                    className={`side-panel-btn ${selectionState.blockType?.startsWith('h') ? 'active' : ''}`}
                    onPointerDown={handleHeadingCycle}
                    title="Cycle Heading (H2-H4)"
                >
                    <Type size={18} className="side-panel-btn-icon" />
                    <span>Heading</span>
                </button>
                <button
                    className={`side-panel-btn ${selectionState.blockType === 'ul' || selectionState.blockType === 'ol' ? 'active' : ''}`}
                    onPointerDown={handleListCycle}
                    title="Cycle List (UL/OL/Off)"
                >
                    <List size={18} className="side-panel-btn-icon" />
                    <span>List</span>
                </button>
            </div>

            <div className="side-panel-divider" />

            <div className="side-panel-toolbar-group">
                <button
                    className={`side-panel-btn ${selectionState.isLink ? 'active' : ''}`}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onAction('link');
                    }}
                    title="Insert Link"
                >
                    <Link size={18} className="side-panel-btn-icon" />
                    <span>Link</span>
                </button>
                <button
                    className="side-panel-btn"
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onAction('clearFormatting');
                    }}
                    title="Clear formatting"
                >
                    <Eraser size={18} className="side-panel-btn-icon" />
                    <span>Clear</span>
                </button>
            </div>
        </div>
    );
}
