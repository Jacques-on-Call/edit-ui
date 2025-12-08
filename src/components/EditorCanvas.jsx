import { h } from 'preact';
import { useContext } from 'preact/hooks';
import FloatingToolbar from './FloatingToolbar';
import VerticalToolbox from './VerticalToolbox';
import BottomActionBar from './BottomActionBar';
import AddSectionModal from './AddSectionModal';
import { EditorContext } from '../contexts/EditorContext';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';


export default function EditorCanvas(props) {
  const { selectionState, handleAction } = useContext(EditorContext);

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
      <FloatingToolbar handleAction={handleAction} selectionState={selectionState} />
      <VerticalToolbox handleAction={handleAction} />
      <main
        class="flex-grow relative overflow-y-auto"
        style={{
          paddingBottom: 'var(--bottom-bar-height)'
        }}
      >
        {renderContent()}
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