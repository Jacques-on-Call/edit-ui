import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import {
    Bold, Italic, Underline, Strikethrough, Code,
    Type, Palette, Highlighter, Eraser, Link, X,
    Heading2, Heading3, Heading4, List, ListOrdered
} from 'lucide-preact';
import { useEditor } from '../contexts/EditorContext';
import './SidePanelToolbar.css';

export default function SidePanelToolbar() {
    const { selectionState, handleAction, isToolbarInteractionRef } = useEditor();
    const [showToolbar, setShowToolbar] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleSelection = () => {
            const text = window.getSelection().toString();
            setShowToolbar(text.length > 0);
        };
        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, []);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showToolbar && panelRef.current && !panelRef.current.contains(e.target)) {
                setShowToolbar(false);
            }
        };

        if (showToolbar) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showToolbar]);


    const onAction = (action, payload) => {
        if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
        handleAction(action, payload);
    };

    const handleHeadingCycle = (e) => {
        e.preventDefault();
        if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
        const sequence = ['paragraph', 'h2', 'h3', 'h4'];
        const currentIndex = sequence.indexOf(selectionState.blockType);
        const nextType = sequence[(currentIndex + 1) % sequence.length];
        onAction('heading', nextType === 'paragraph' ? null : nextType);
    };

    const handleListCycle = (e) => {
        e.preventDefault();
        if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
        if (selectionState.blockType === 'ul') {
            onAction('list', 'ol');
        } else if (selectionState.blockType === 'ol') {
            onAction('list', null);
        } else {
            onAction('list', 'ul');
        }
    };

    return createPortal(
        <div
            ref={panelRef}
            className={`side-panel-toolbar ${showToolbar ? 'is-open' : ''} z-50`}
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
                        if (isToolbarInteractionRef) isToolbarInteractionRef.current = true;
                        setShowToolbar(false);
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
        </div>,
        document.body
    );
}
