import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { fetchPageJson } from '../lib/mockApi';
import BottomActionBar from '../components/BottomActionBar';
import BlockTree from '../components/BlockTree';
import { fetchPageJson, saveDraft, publishPage } from '../lib/mockApi';
import useAutosave from '../hooks/useAutosave';
import './ContentEditorPage.css';

export default function ContentEditorPage(props) {
  const pageId = (props && props.pageId) || (typeof window !== 'undefined' && new URL(window.location.href).pathname.split('/').pop()) || 'home';
  const [content, setContent] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const iframeRef = useRef(null);
  const mounted = useRef(true);

  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    mounted.current = true;
    console.log('[ContentEditor] mounted');
    return () => {
      mounted.current = false;
      console.log('[ContentEditor] unmounted');
    };
  }, []);

  // Mobile detection (short)
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width:640px)').matches : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width:640px)');
    const onChange = (e) => {
      const newVal = !!e.matches;
      setIsMobile(prev => {
        if (prev === newVal) return prev;
        console.log('[ContentEditor] isMobile changed ->', newVal);
        return newVal;
      });
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // drawers state (left/right)
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useEffect(() => {
    console.log('[ContentEditor] Loading page:', pageId);
    fetchPageJson(pageId).then((pj) => {
      console.log('[ContentEditor] page.json loaded:', pj);
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
        const result = await saveDraft(payload);
        if (!result || !result.ok) {
          console.error('[ContentEditor] autosave failed, saveDraft returned an error:', result && result.error ? result.error : result);
          return;
        }
        console.log('[ContentEditor] autosave success, key=', result.key);
      } catch (err) {
        console.error('[ContentEditor] autosave unexpected error:', err && err.message ? err.message : err);
      }
    },
    debugLabel: 'autosave',
    delay: 1500,
  });

  useEffect(() => {
    if (!pageJson) return;
    console.log('[ContentEditor] content changed, length:', content.length);
    scheduleSave({ slug: pageJson.meta?.slug || pageId, content, meta: pageJson.meta || {} });
  }, [content, pageJson, scheduleSave, pageId]);

  // message listener kept but quiet for now
  useEffect(() => {
    function onMessage(e) {
      if (!e?.data) return;
      console.log('[ContentEditor] received message from preview iframe:', e.data);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function handleSelectBlock(id) {
    console.log('[ContentEditor] selected block:', id);
    setSelectedBlockId(id);
    if (isMobile) {
      setRightOpen(true);
      console.log('[ContentEditor] rightDrawerOpen -> true (auto open on select)');
    }
  }

  function handleTabSwitch(tab) {
    console.log('[ContentEditor] tab ->', tab);
    if (tab === activeTab) return;
    setActiveTab(tab);
  }

  // Ensure we only set content when changed (avoid noisy re-renders)
  function handleEditorInput(e) {
    const val = e.currentTarget.innerHTML;
    if (val === content) return;
    setContent(val);
  }

  // Publish handler (new for sprint)
  async function handlePublish() {
    console.log('[ContentEditor] publish requested for page:', pageJson?.meta?.slug || pageId);
    if (!pageJson) {
      console.warn('[ContentEditor] publish aborted: no pageJson loaded');
      return;
    }

    const slug = pageJson.meta?.slug || pageId;
    const payload = { slug, content, meta: pageJson.meta || {} };

    try {
      console.log('[ContentEditor] publish start - ensuring draft saved');
      setIsPublishing(true);

      // Save draft now to ensure current content persisted
      const saveRes = await saveDraft(payload);
      if (!saveRes || !saveRes.ok) {
        console.error('[ContentEditor] publish aborted: saveDraft returned error', saveRes && saveRes.error ? saveRes.error : saveRes);
        setIsPublishing(false);
        return;
      }
      console.log('[ContentEditor] draft saved, key=', saveRes.key);

      // Call mock publish
      console.log('[ContentEditor] calling publishPage for', slug);
      const publishRes = await publishPage(payload);
      if (!publishRes || !publishRes.ok) {
        console.error('[ContentEditor] publish failed:', publishRes && publishRes.error ? publishRes.error : publishRes);
        setIsPublishing(false);
        return;
      }

      console.log('[ContentEditor] publish success, url=', publishRes.url);
      try {
        window.open(publishRes.url, '_blank');
      } catch (err) {
        console.warn('[ContentEditor] could not open preview tab (popup blocked?)', err);
      }

      setIsPublishing(false);
    } catch (err) {
      console.error('[ContentEditor] unexpected publish error:', err);
      setIsPublishing(false);
    }
  }

  function handleAdd() {
    console.log('[ContentEditor] Add requested (stub)');
    alert('Add modal (stub). This will be implemented in Sprint 4+.');
  }

  useEffect(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, [pageId]);

  return (
    <div className="editor-shell">
      <EditorHeader
        title={pageJson?.meta?.title || 'Untitled Page'}
        onPublish={handlePublish}
        isSaving={isSaving || isPublishing}
        activeTab={activeTab}
        onTabSwitch={handleTabSwitch}
        onToggleBlocks={() => setLeftOpen(prev => !prev)}
        onToggleInspector={() => setRightOpen(prev => !prev)}
        isMobile={isMobile}
      />

      <div className="editor-body">
        <aside className={`left-pane ${!isMobile ? 'visible' : (leftOpen ? 'drawer open' : 'hidden')}`}>
          <BlockTree blocks={pageJson?.blocks || pageJson?.children || []} onSelect={handleSelectBlock} selectedId={selectedBlockId} />
        </aside>
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

        <aside className={`right-pane ${!isMobile ? 'visible' : (rightOpen ? 'drawer open' : 'hidden')}`}>
          <div className="panel">
            <h4>Inspector (stub)</h4>
            <p>Selected block id: {selectedBlockId || 'none'}</p>
            <pre className="meta">{JSON.stringify(pageJson?.meta || {}, null, 2)}</pre>
          </div>
        </aside>
        {isMobile && rightOpen && <div className="drawer-overlay" onClick={() => { setRightOpen(false); console.log('[ContentEditor] rightDrawerOpen -> false (overlay)'); }} />}
      </div>

      <BottomActionBar onAdd={handleAdd} onPublish={handlePublish} />
    </div>
  );
}
