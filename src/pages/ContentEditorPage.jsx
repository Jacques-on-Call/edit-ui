// easy-seo/src/pages/ContentEditorPage.jsx
import { h } from 'preact';
import { useEffect, useState, useCallback, useRef } from 'preact/hooks';
import * as mockApi from '../lib/mockApi';
import { useAutosave } from '../hooks/useAutosave';
import Icon from '../components/Icon';

import EditorHeader from '../components/EditorHeader';
import BlockTree from '../components/BlockTree';
import BottomActionBar from '../components/BottomActionBar';
import '../editor.css'; // Import the new CSS

const ContentEditorPage = ({ pageId }) => {
  const [pageData, setPageData] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width:640px)').matches);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width:640px)');
    const onChange = (e) => { setIsMobile(e.matches); console.log('[ContentEditor] isMobile:', e.matches); };
    mq.addEventListener('change', onChange);
    if (typeof window !== 'undefined') console.log('[ContentEditor] isMobile:', isMobile);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Iframe message listener
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      console.log("[ContentEditor] received message from preview iframe:", event.data);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendPreviewPatch = useCallback((newContent) => {
    if (iframeRef.current?.contentWindow) {
      const msg = { type: 'preview-patch', payload: { content: newContent } };
      console.log("[ContentEditor] sending postMessage to preview iframe:", msg);
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  }, []);

  useEffect(() => {
    console.log(`[ContentEditor] Loading page: ${pageId}`);
    mockApi.fetchPageJson(pageId)
      .then(data => {
        console.log(`[ContentEditor] page.json loaded:`, JSON.stringify(data));
        setPageData(data);
        setContent(data.content || '');
      })
      .catch(err => setError('Failed to load page data.'));
  }, [pageId]);

  const handleAutosave = useCallback((dataToSave) => {
    console.log("[ContentEditor] autosave onSave handler triggered");
    mockApi.saveDraft(pageId, { content: dataToSave })
      .then(() => {
        console.log("[ContentEditor] autosave success");
        sendPreviewPatch(dataToSave);
      })
      .catch(err => console.error("[ContentEditor] autosave failed:", err));
  }, [pageId, sendPreviewPatch]);

  const scheduleSave = useAutosave({ onSave: handleAutosave, data: content });

  const handleContentChange = (e) => {
    const newContent = e.currentTarget.innerText;
    console.log(`[ContentEditor] content changed, length: ${newContent.length}`);
    setContent(newContent);
    scheduleSave();
  };

  const toggleLeft = () => setLeftOpen(prev => { const v = !prev; console.log('[ContentEditor] leftDrawerOpen ->', v); return v; });
  const toggleRight = () => setRightOpen(prev => { const v = !prev; console.log('[ContentEditor] rightDrawerOpen ->', v); return v; });
  const togglePreview = () => setPreviewOpen(prev => { const v = !prev; console.log('[ContentEditor] preview open ->', v); return v; });


  if (error) return <div class="p-4 text-red-500">{error}</div>;
  if (!pageData) return <div class="p-4 text-gray-400">Loading editor...</div>;

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      <EditorHeader>
        {isMobile && <button onClick={toggleLeft} class="p-2 -ml-2 font-semibold flex items-center gap-2"><Icon name="sidebar" /> Blocks</button>}
      </EditorHeader>

      <div class="editor-body flex-grow overflow-hidden">
        <aside className={`left-pane ${isMobile ? (leftOpen ? 'open' : '') : 'visible'}`}>
          <BlockTree blocks={pageData.blocks} onSelectBlock={() => { if(isMobile) { setLeftOpen(false); toggleRight(); } }} />
        </aside>

        <main class="main-pane flex flex-col overflow-hidden" onFocus={() => console.log('[ContentEditor] editor focus')}>
           <div
            contentEditable
            onInput={handleContentChange}
            class="flex-grow p-4 overflow-y-auto"
            style={{paddingBottom: 'calc(var(--bottom-bar-height, 64px) + env(safe-area-inset-bottom))'}}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </main>

        <aside className={`right-pane ${isMobile ? (rightOpen ? 'open' : '') : 'visible'}`}>
            <div class="p-2">Inspector</div>
            {!isMobile && (
              <iframe
                ref={iframeRef}
                src="/preview/mock-preview.html"
                class="w-full h-1/2 border-t border-gray-700 mt-2"
                title="Preview"
              />
            )}
        </aside>

        {(isMobile && (leftOpen || rightOpen)) && (
          <div class="drawer-overlay" onClick={() => { setLeftOpen(false); setRightOpen(false); }}></div>
        )}
      </div>

      <BottomActionBar slug={pageId}>
        {isMobile ? (
          <>
            <button onClick={toggleRight} class="p-2 font-semibold flex items-center gap-2"><Icon name="settings-2" /> Inspect</button>
            <button onClick={togglePreview} class="p-2 font-semibold flex items-center gap-2"><Icon name="eye" /> Preview</button>
          </>
        ) : null}
      </BottomActionBar>

      {/* Mobile Preview Overlay */}
      {isMobile && previewOpen && (
        <div class="fixed inset-0 bg-black z-30 flex flex-col">
          <div class="p-2 bg-gray-800 flex justify-between items-center">
            <span class="font-semibold">Preview</span>
            <button onClick={togglePreview} class="p-2"><Icon name="x" /></button>
          </div>
          <iframe
            ref={iframeRef}
            src="/preview/mock-preview.html"
            class="flex-grow w-full"
            title="Preview"
          />
        </div>
      )}
    </div>
  );
};

export default ContentEditorPage;
