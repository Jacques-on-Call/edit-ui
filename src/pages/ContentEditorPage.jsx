// easy-seo/src/pages/ContentEditorPage.jsx
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useAutosave } from '../hooks/useAutosave';
import * as mockApi from '../lib/mockApi';

import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import BlockTree from '../components/BlockTree';

const ContentEditorPage = ({ pageId }) => {
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const iframeRef = useRef(null);

  // --- Data Fetching ---
  useEffect(() => {
    console.log(`[ContentEditor] Loading page: ${pageId}`);
    setIsLoading(true);
    mockApi.fetchPageJson(pageId).then(data => {
      const pj = JSON.stringify(data);
      console.log(`[ContentEditor] page.json loaded: ${pj}`);
      setPageJson(data);
      setContent(data.meta.initialContent || '');
      setIsLoading(false);
    });
  }, [pageId]);

  // --- Autosave ---
  const handleSave = useCallback(async () => {
    console.log("[ContentEditor] autosave onSave handler triggered");
    try {
      const result = await mockApi.saveDraft(pageId, content);
      if (result.ok) {
        console.log('[ContentEditor] autosave success');
        if (iframeRef.current && iframeRef.current.contentWindow) {
          const msg = { type: 'preview-patch', payload: { html: content } };
          console.log(`[ContentEditor] sending postMessage to preview iframe: ${JSON.stringify(msg)}`);
          iframeRef.current.contentWindow.postMessage(msg, '*');
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(`[ContentEditor] autosave failed: ${err}`);
    }
  }, [pageId, content]);

  const { scheduleSave, isSaving } = useAutosave(handleSave, 1500, "autosave");

  // --- Iframe Communication ---
  useEffect(() => {
    const handleMessage = (event) => {
      // Basic security: check origin in a real app
      // if (event.origin !== 'YOUR_PREVIEW_ORIGIN') return;
      if (event.source === iframeRef.current?.contentWindow) {
         console.log(`[ContentEditor] received message from preview iframe: ${JSON.stringify(event.data)}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Event Handlers ---
  const handleContentChange = (e) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    const n = newContent.length;
    console.log(`[ContentEditor] content changed, length: ${n}`);
    scheduleSave();
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleSelectBlock = (id) => {
    console.log(`[BlockTree] node clicked: ${id}`);
    setSelectedBlockId(id);
    console.log(`[ContentEditor] selected block: ${id}`);
  };

  const handlePublish = () => {
    const slug = pageJson?.meta?.slug;
    console.log(`[ContentEditor] publish requested for page: ${slug}`);
    console.log('[BottomBar] Publish clicked');
  };

  const handleHomeClick = () => {
    console.log('[BottomBar] Home clicked');
    // Implement navigation to home
  };

  const handleAddClick = () => {
    console.log('[BottomBar] Add clicked');
    // Implement add functionality
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorHeader
        title={pageJson?.meta?.title}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPublish={handlePublish}
        isSaving={isSaving}
      />
      <main className="flex-grow flex pb-16 overflow-hidden">
        {activeTab === 'visual' && (
          <div className="w-1/4 bg-black/20 border-r border-white/10 overflow-y-auto">
            <BlockTree
              blocks={pageJson?.children}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
            />
          </div>
        )}

        <div className="flex-grow flex flex-col overflow-y-auto">
          {activeTab === 'content' ? (
            <div
              contentEditable
              onInput={handleContentChange}
              dangerouslySetInnerHTML={{ __html: content }}
              className="flex-grow p-8 text-white bg-transparent focus:outline-none"
            />
          ) : (
            <div className="flex-grow p-8 text-gray-400">
              Visual Editor Area (Sprint 2)
            </div>
          )}
        </div>

        <div className="w-1/3 bg-black/20 border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-lg">Inspector</h3>
            {selectedBlockId ? (
              <p className="text-sm text-gray-300">Selected block id: {selectedBlockId}</p>
            ) : (
              <p className="text-sm text-gray-500">Select a block to see details.</p>
            )}
          </div>
          <div className="flex-grow flex flex-col">
             <h3 className="font-bold text-lg p-4">Live Preview</h3>
            <iframe
              ref={iframeRef}
              src="/preview/mock-preview.html"
              className="w-full h-full border-0"
              title="Live Preview"
            />
          </div>
        </div>
      </main>
      <BottomActionBar onPublish={handlePublish} onHome={handleHomeClick} onAdd={handleAddClick} />
    </div>
  );
};

export default ContentEditorPage;
