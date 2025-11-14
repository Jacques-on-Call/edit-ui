import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import BlockTree from '../components/BlockTree';
import { fetchPageJson, saveDraft } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import './ContentEditorPage.css';

/**
 * ContentEditorPage (mobile-first)
 * - Detects mobile (matchMedia)
 * - Adds left/right drawer toggles for mobile
 * - Keeps desktop 3-column layout
 * - Extensive console logs for verification
 */

export default function ContentEditorPage(props) {
  const pageId = (props && props.pageId) || (typeof window !== 'undefined' && new URL(window.location.href).pathname.split('/').pop()) || 'home';
  const [activeTab, setActiveTab] = useState('content');
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const iframeRef = useRef(null);

  // Mobile detection and toggles for drawers
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width:640px)').matches : false;
    } catch (e) {
      return false;
    }
  });
  useEffect(() => {
    console.log('[ContentEditor] initial isMobile:', isMobile);
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width:640px)');
    const onChange = (e) => {
      const newVal = !!e.matches;
      if (newVal !== isMobile) {
        setIsMobile(newVal);
        console.log('[ContentEditor] isMobile changed ->', newVal);
      } else {
        // avoid setState if no change
        console.log('[ContentEditor] isMobile change event ignored (no change).');
      }
    };
    // use addEventListener for newer browsers, fallback to addListener
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const [leftOpen, setLeftOpen] = useState(false);   // blocks drawer
  const [rightOpen, setRightOpen] = useState(false); // inspector drawer

  function toggleLeft() {
    setLeftOpen(prev => {
      const v = !prev;
      console.log('[ContentEditor] leftDrawerOpen ->', v);
      return v;
    });
  }
  function toggleRight() {
    setRightOpen(prev => {
      const v = !prev;
      console.log('[ContentEditor] rightDrawerOpen ->', v);
      return v;
    });
  }

  useEffect(() => {
    console.log('[ContentEditor] Loading page:', pageId);
    fetchPageJson(pageId).then((pj) => {
      console.log('[ContentEditor] page.json loaded:', pj);
      setPageJson(pj);
      const firstTextNode = (pj?.blocks || []).find((c) => c.type === 'paragraph' || c.type === 'heading') || null;
      setContent(firstTextNode?.content || pj?.content || '<p>Your content here</p>');
    }).catch((err) => {
      console.error('[ContentEditor] fetchPageJson error:', err);
    });
  }, [pageId]);

  const { scheduleSave, isSaving } = useAutosave({
    onSave: async (payload) => {
      console.log('[ContentEditor] autosave onSave handler triggered');
      try {
        await saveDraft(payload);
        console.log('[ContentEditor] autosave success');
        const msg = { type: 'preview-patch', payload: { html: payload.content }, ts: Date.now() };
        console.log('[ContentEditor] sending postMessage to preview iframe:', msg);
        try {
          iframeRef.current?.contentWindow?.postMessage(msg, '*');
        } catch (err) {
          console.warn('[ContentEditor] postMessage failed:', err);
        }
      } catch (err) {
        console.error('[ContentEditor] autosave failed:', err);
      }
    },
    debugLabel: 'autosave',
    delay: 1500,
  });

  useEffect(() => {
    if (pageJson) {
      console.log('[ContentEditor] content changed, length:', content.length);
      scheduleSave({ slug: pageJson.meta?.slug || pageId, content, meta: pageJson.meta || {} });
    }
  }, [content, pageJson, scheduleSave, pageId]);

  useEffect(() => {
    function onMessage(e) {
      if (!e?.data) return;
      console.log('[ContentEditor] received message from preview iframe:', e.data);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function handleTabSwitch(tab) {
    console.log('[ContentEditor] tab ->', tab);
    setActiveTab(tab);
  }

  function handleEditorInput(e) {
    const val = e.currentTarget.innerHTML;
    if (val !== content) {
      setContent(val);
    } else {
      console.log('[ContentEditor] editor input ignored (same content)');
    }
  }

  function handleSelectBlock(id) {
    console.log('[ContentEditor] selected block:', id);
    setSelectedBlockId(id);
    // open inspector automatically on mobile for discoverability
    if (isMobile) {
      setRightOpen(true);
      console.log('[ContentEditor] rightDrawerOpen -> true (auto open on select)');
    }
  }

  function handlePublish() {
    console.log('[ContentEditor] publish requested for page:', pageJson?.meta?.slug || pageId);
  }

  function handleAdd() {
    console.log('[ContentEditor] Add requested (stub)');
    alert('Add modal (stub). This will be implemented in Sprint 2+.');
  }

  // Close drawers when route / pageId changes (safety)
  useEffect(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, [pageId]);

  useEffect(() => {
    console.log('[ContentEditor] mounted');
    return () => {
      console.log('[ContentEditor] unmounted');
    };
  }, []);

  return (
    <div className="editor-shell">
      <EditorHeader
        title={pageJson?.meta?.title || 'Untitled Page'}
        onPublish={handlePublish}
        isSaving={isSaving}
        activeTab={activeTab}
        onTabSwitch={handleTabSwitch}
        onToggleBlocks={toggleLeft}
        onToggleInspector={toggleRight}
        isMobile={isMobile}
      />

      <div className="editor-body">
        {/* Left pane - desktop visible, mobile drawer when leftOpen */}
        <aside className={`left-pane ${!isMobile ? 'visible' : (leftOpen ? 'drawer open' : 'hidden')}`}>
          <BlockTree blocks={pageJson?.blocks || pageJson?.children || []} onSelect={handleSelectBlock} selectedId={selectedBlockId} />
        </aside>

        {/* Drawer overlay for left */}
        {isMobile && leftOpen && <div className="drawer-overlay" onClick={() => { setLeftOpen(false); console.log('[ContentEditor] leftDrawerOpen -> false (overlay)'); }} />}

        <main className="main-pane" style={{ paddingBottom: 'calc(var(--bottom-bar-height,64px) + env(safe-area-inset-bottom))' }}>
          {activeTab === 'content' ? (
            <div className="content-editor">
              <div className="editor-instructions">[Sprint1] Content editor (placeholder). Replace with Lexical in Sprint 2.</div>
              <div
                className="editor-area"
                contentEditable
                onInput={handleEditorInput}
                dangerouslySetInnerHTML={{ __html: content }}
                role="textbox"
                aria-multiline="true"
                suppressContentEditableWarning
                onFocus={() => console.log('[ContentEditor] editor focus')}
              />
            </div>
          ) : (
            <div className="visual-editor">
              <div className="visual-hint">Select a block from the left to inspect (selection logs to console).</div>
              <div className="visual-canvas">
                <iframe
                  title="Preview (mock)"
                  ref={iframeRef}
                  src="/preview/mock-preview.html"
                  className="preview-iframe"
                />
              </div>
            </div>
          )}
        </main>

        {/* Right pane - desktop visible, mobile drawer when rightOpen */}
        <aside className={`right-pane ${!isMobile ? 'visible' : (rightOpen ? 'drawer open' : 'hidden')}`}>
          <div className="panel">
            <h4>Inspector (stub)</h4>
            <p>Selected block id: {selectedBlockId || 'none'}</p>
            <pre className="meta">{JSON.stringify(pageJson?.meta || {}, null, 2)}</pre>
          </div>
        </aside>

        {/* Drawer overlay for right */}
        {isMobile && rightOpen && <div className="drawer-overlay" onClick={() => { setRightOpen(false); console.log('[ContentEditor] rightDrawerOpen -> false (overlay)'); }} />}
      </div>

      <BottomActionBar onAdd={handleAdd} onPublish={handlePublish} />
    </div>
  );
}
