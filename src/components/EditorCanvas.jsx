import { h } from 'preact';
import { useState, useContext, useEffect, useMemo, useRef } from 'preact/hooks';
import SlideoutToolbar from './SlideoutToolbar';
import BottomActionBar from './BottomActionBar';
import AddSectionModal from './AddSectionModal';
import { EditorContext } from '../contexts/EditorContext';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';


export default function EditorCanvas(props) {
  const { selectionState, handleAction } = useContext(EditorContext);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorReadyRef = useRef(false);

  // Callback for child to signal readiness
  const handleEditorReady = () => {
    if (!editorReadyRef.current) {
      console.log('[EditorCanvas] Editor is ready, rendering toolbar for the first time.');
      setIsEditorReady(true);
      editorReadyRef.current = true;
    }
  };
  
  const {
    viewMode,
    pageId,
    renderContent,
    saveStatus,
    syncStatus,
    isPreviewBuilding,
    pageScoreData,
    editorMode,
    openAddSectionModal,
    handlePreview,
    handleSync,
    handleRefreshPreview,
    sections,
    handleAddSection,
    editingSectionIndex,
    handleUpdateSection,
  } = props;

  return (
    <div class="flex flex-col h-full bg-transparent text-white relative">
      <SlideoutToolbar />
      <main
        class="flex-grow relative overflow-y-auto"
        style={{
          paddingBottom: 'var(--bottom-bar-height)'
        }}
      >
        {renderContent({ onEditorReady: handleEditorReady })}
      </main>
      <BottomActionBar
        saveStatus={saveStatus}
        syncStatus={syncStatus}
        viewMode={viewMode}
        previewState={isPreviewBuilding ? 'building' : (viewMode !== 'editor' ? 'ready' : 'idle')}
        pageScore={editorMode === 'json' ? pageScoreData.total : null}
        onAdd={openAddSectionModal}
        onPreview={editorMode === 'json' ? handlePreview : null}
        onSync={editorMode === 'json' ? handleSync : null}
        onRefreshPreview={handleRefreshPreview}
      />
      <AddSectionModal
        pageSlug={pageId}
        pageData={{ sections: sections || [] }}
        onAddSection={handleAddSection}
        sectionToEdit={editingSectionIndex !== null ? (sections ? sections[editingSectionIndex] : null) : null}
        onUpdateSection={handleUpdateSection}
      />
    </div>
  );
}