import React, { useState, useEffect } from 'react';
import TopToolbar from './TopToolbar';
import ContentCanvas from './ContentCanvas';
import PropertiesPanel from './PropertiesPanel';
import BlockPalette from './BlockPalette';

export default function ContentModeEditor({ initialContent, initialSha }) {
  const [contentTree, setContentTree] = useState(initialContent || []);
  const [selectedId, setSelectedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [currentSha, setCurrentSha] = useState(initialSha);

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
      <div className="flex flex-grow overflow-hidden">
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
      </div>
      <footer className="bg-white border-t border-gray-200 p-4">
        <BlockPalette
          onContentChange={handleContentChange}
          contentTree={contentTree}
          selectedId={selectedId}
        />
      </footer>
    </div>
  );
}
