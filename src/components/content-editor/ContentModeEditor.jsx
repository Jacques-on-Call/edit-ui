import React, { useState, useEffect } from 'react';
import TopToolbar from './TopToolbar';
import ContentCanvas from './ContentCanvas';
import PropertiesPanel from './PropertiesPanel';
import BottomToolbox from './BottomToolbox';

export default function ContentModeEditor({ initialContent, initialSha }) {
  const [contentTree, setContentTree] = useState(initialContent || []);
  const [selectedId, setSelectedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [currentSha, setCurrentSha] = useState(initialSha);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);

  // Warn user about unsaved changes before leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleContentChange = (newContentTree) => {
    setContentTree(newContentTree);
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  const selectedBlock = selectedId ? contentTree.find(block => block.id === selectedId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <TopToolbar
        contentTree={contentTree}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        currentSha={currentSha}
        setCurrentSha={setCurrentSha}
      />
      <div className="flex flex-grow overflow-hidden relative">
        <main className="flex-grow p-4 overflow-y-auto">
          <ContentCanvas
            contentTree={contentTree}
            onContentChange={handleContentChange}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </main>
        <aside className="w-96 bg-white p-4 border-l border-gray-200 overflow-y-auto">
          <PropertiesPanel
            selectedBlock={selectedBlock}
            onContentChange={handleContentChange}
            contentTree={contentTree}
          />
        </aside>

        {!isToolboxOpen && (
          <button
            onClick={() => setIsToolboxOpen(true)}
            className="absolute bottom-6 right-[26rem] p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Add block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
        )}
      </div>

      <BottomToolbox
        isOpen={isToolboxOpen}
        onClose={() => setIsToolboxOpen(false)}
        onContentChange={handleContentChange}
        contentTree={contentTree}
        selectedId={selectedId}
      />
    </div>
  );
}
