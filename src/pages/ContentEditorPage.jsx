// easy-seo/src/pages/ContentEditorPage.jsx
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useAutosave } from '../hooks/useAutosave';
import { fetchPageJson, saveDraft } from '../lib/mockApi';

import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import BlockTree from '../components/BlockTree';
import Icon from '../components/Icon';

const ContentEditorPage = ({ pageId }) => {
  const [pageJson, setPageJson] = useState(null);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const iframeRef = useRef(null);

  // --- Data Fetching ---
  useEffect(() => {
    console.log('[ContentEditor] Loading mock page.json...');
    setIsLoading(true);
    fetchPageJson(pageId).then(data => {
      console.log('[ContentEditor] page.json loaded:', data);
      setPageJson(data);
      setContent(data.meta.initialContent || '');
      setIsLoading(false);
    });
  }, [pageId]);

  // --- Autosave ---
  const handleSave = useCallback(async () => {
    console.log('[ContentEditor] autosave start');
    const result = await saveDraft(pageId, content);
    if (result.ok) {
      console.log('[ContentEditor] autosave success');
      // Send message to preview iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const message = { type: 'preview-patch', payload: { html: content } };
        console.log('[ContentEditor] sending postMessage to preview iframe:', message);
        try {
          iframeRef.current.contentWindow.postMessage(message, '*');
        } catch (error) {
          console.error('[ContentEditor] postMessage failed:', error);
        }
      }
    } else {
      console.error('[ContentEditor] autosave failure:', result.error);
    }
  }, [pageId, content]);

  const { scheduleSave, isSaving } = useAutosave(handleSave, 1500);

  // --- Iframe Communication ---
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source === iframeRef.current?.contentWindow) {
         console.log('[ContentEditor] received message from preview iframe:', event.data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Event Handlers ---
  const handleContentChange = (e) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    console.log(`[ContentEditor] content changed, length: ${newContent.length}`);
    scheduleSave();
  };

  const handleTabChange = (tab) => {
    console.log(`[ContentEditor] tab -> ${tab}`);
    setActiveTab(tab);
  };

  const handleSelectBlock = (blockId) => {
    setSelectedBlockId(blockId);
    console.log(`[ContentEditor] selected block: ${blockId}`);
  };

  const handlePublish = () => {
    console.log('[ContentEditor] publish requested, current content:', content);
    alert('Publish functionality is a stub for Sprint 1.');
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <EditorHeader
        title={pageJson?.meta?.title}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onPublish={handlePublish}
        isSaving={isSaving}
      />
      <main className="flex-grow flex pb-16">
        {/* Left Panel: BlockTree (Visible on 'visual' tab) */}
        {activeTab === 'visual' && (
          <div className="w-1/4 bg-black/20 border-r border-white/10 overflow-y-auto">
            <BlockTree
              blocks={pageJson?.children}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
            />
          </div>
        )}

        {/* Center Panel: Content or Visual Editor */}
        <div className="flex-grow flex flex-col">
          {activeTab === 'content' ? (
            <div
              contentEditable
              onInput={handleContentChange}
              dangerouslySetInnerHTML={{ __html: content }}
              className="flex-grow p-8 text-white bg-transparent focus:outline-none"
              role="textbox"
              aria-multiline="true"
            />
          ) : (
            <div className="flex-grow p-8 text-gray-400">
              Visual Editor Area (Sprint 2)
            </div>
          )}
        </div>

        {/* Right Panel: Inspector and Preview */}
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
      <BottomActionBar onPublish={handlePublish} />
    </div>
  );
};

export default ContentEditorPage;
