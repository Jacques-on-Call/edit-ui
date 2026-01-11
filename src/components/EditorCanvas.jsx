import { h } from 'preact';
import { useState, useContext, useEffect, useMemo, useRef } from 'preact/hooks';
import FloatingToolbar from './FloatingToolbar';
import UnifiedLiquidRail from './UnifiedLiquidRail';
import BottomActionBar from './BottomActionBar';
import AddSectionModal from './AddSectionModal';
import ReportIssueModal from './ReportIssueModal';
import { EditorContext } from '../contexts/EditorContext';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';


export default function EditorCanvas(props) {
  const { selectionState, handleAction } = useContext(EditorContext);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [railWidth, setRailWidth] = useState(0); // State to hold the rail's width

  // Callback for the rail to report its width
  const handleRailWidthChange = (newWidth) => {
    setRailWidth(newWidth);
  };

  // Dynamic padding style
  const mainContentStyle = {
    paddingBottom: 'var(--bottom-bar-height)',
    transition: 'padding-left 300ms ease-in-out',
    paddingLeft: `calc(${railWidth}px + 16px)`, // 16px is the base offset
  };

  // Callback for child to signal readiness
  const handleEditorReady = () => {
    setIsEditorReady(true);
  };

  // Memoize offset object to prevent re-renders
  const toolbarOffset = useMemo(() => ({ x: 0, y: 10 }), []);

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
    needsDeployment
  } = props;

  return (
    <div class="flex flex-col h-full bg-transparent text-white relative">
      {/* 
      {isEditorReady && (
        <FloatingToolbar
          editorRootSelector=".editor-input"
          offset={toolbarOffset}
          cooldownMs={200}
        />
      )}
      */}
      {viewMode !== 'livePreview' && (
        <UnifiedLiquidRail onWidthChange={handleRailWidthChange} />
      )}
      <main
        class="flex-grow relative overflow-y-auto"
        style={mainContentStyle}
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
        onReport={() => setIsReportModalOpen(true)}
      />
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        context={{
          pageId,
          viewMode,
          editorMode,
          saveStatus,
          syncStatus,
          selectionState
        }}
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
