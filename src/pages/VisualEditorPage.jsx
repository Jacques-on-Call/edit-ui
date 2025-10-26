import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { parseAstroToBlueprint } from '../lib/layouts/parseAstro';
import { compileAstro } from '../lib/layouts/compileAstro';
import { validateAstroLayout } from '../lib/layouts/validateAstro';
import VisualSidebar from '../components/VisualSidebar';
import Icon from '../components/Icon';
import PreviewPane from '../components/PreviewPane';
import MobileQuickBar from '../components/MobileQuickBar';
import ComponentsDock from '../components/ComponentsDock';
import DesignSheet from '../components/DesignSheet';
import OverlayCanvas from '../components/OverlayCanvas';
import BlockSettingsSheet from '../components/BlockSettingsSheet';
import { usePreviewController } from '../hooks/usePreviewController';
import { useAutosave } from '../hooks/useAutosave';
import { useLongPress } from '../hooks/useLongPress';
import { useDraggable } from '../hooks/useDraggable';
import BlockContextMenu from '../components/BlockContextMenu';
import { ensureUniqueAstroPath } from '../utils/uniquePath';
import { EditorModes } from '../state/editorModes';

function VisualEditorPage() {
  const [blueprint, setBlueprint] = useState(null);
  const [fileSha, setFileSha] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorMode, setEditorMode] = useState(EditorModes.None);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, blockId: null });
  const [isDesignPanelOpen, setIsDesignPanelOpen] = useState(false);
  const location = useLocation();
  const previewIframeRef = useRef(null);
  const {
    stale,
    setStale,
    building,
    builtAtISO,
    lastRunId,
    error: previewError,
    triggerBuild,
    rebuildDisabled,
    rebuildCountdown,
  } = usePreviewController();

  useAutosave(blueprint, setBlueprint, fileSha);

  const handleAddBlock = (type) => {
    if (!blueprint) return;

    // A real implementation would have default props based on type
    const newBlock = {
      type: 'component',
      name: type,
      props: {},
    };

    // Default to adding to postContent for now.
    // This will be expanded to support selected regions.
    const updatedBlueprint = {
      ...blueprint,
      postContent: [...(blueprint.postContent || []), newBlock],
    };

    setBlueprint(updatedBlueprint);
    setEditorMode(EditorModes.None);
  };

  const handleThemeChange = (key, value) => {
    if (!blueprint) return;

    // Use a nested property update, e.g., 'theme.background'
    const [themeKey, property] = key.split('.');

    const updatedBlueprint = {
      ...blueprint,
      theme: {
        ...blueprint.theme,
        [property]: value,
      },
    };
    setBlueprint(updatedBlueprint);
  };

  const handleContextMenuAction = (action) => {
    alert(`Action: ${action} on block ${contextMenu.blockId}`);
    setContextMenu({ visible: false, x: 0, y: 0, blockId: null });
  };

  const handleSelectBlock = (blockId) => {
    setSelectedBlockId(blockId);
  };

  const handleBlockChange = (key, value) => {
    if (!blueprint || !selectedBlockId) return;

    const [propType, propName] = key.split('.');

    const updatedBlueprint = {
      ...blueprint,
      preContent: blueprint.preContent.map(block =>
        block.id === selectedBlockId ? { ...block, [propType]: { ...block[propType], [propName]: value } } : block
      ),
      postContent: blueprint.postContent.map(block =>
        block.id === selectedBlockId ? { ...block, [propType]: { ...block[propType], [propName]: value } } : block
      ),
    };

    setBlueprint(updatedBlueprint);
  };

  const openContextMenu = (event, blockId) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      blockId,
    });
  };

  const handleSave = async () => {
    if (!blueprint) return;

    const content = compileAstro(blueprint);
    const { ok, errors } = validateAstroLayout(content);

    if (!ok) {
      setError(`Validation failed: ${errors.join(', ')}`);
      return;
    }

    const repo = localStorage.getItem('selectedRepo');
    const branch = localStorage.getItem('selectedBranch') || 'main';
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');

    try {
      const response = await fetch('/api/files/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repo,
          path: filePath,
          content: btoa(unescape(encodeURIComponent(content))),
          message: `feat: update ${filePath} from visual editor`,
          sha: fileSha,
        }),
      });
      if (!response.ok) throw new Error('Failed to save file.');
      const { sha } = await response.json();
      setFileSha(sha);
      setStale(true);

      const draftKey = `draft_${repo}_${filePath}_${sha}`;
      localStorage.removeItem(draftKey);

      alert('File saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const applyLayoutToPage = async (layoutPath) => {
    // ... same as before
  };

  const handleSaveAsLayout = async () => {
    // ... same as before
  };

  useEffect(() => {
    const branch = localStorage.getItem('selectedBranch') || 'main';
    const repo = localStorage.getItem('selectedRepo');
    const searchParams = new URLSearchParams(location.search);
    const filePath = searchParams.get('path');
    const isNew = searchParams.get('new') === '1';
    const templatePath = searchParams.get('template'); // For new files

    if (!filePath || !repo) {
      setError('File path and repository are required.');
      setIsLoading(false);
      return;
    }

    const fetchAndParseFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let fileContent, sha;
        if (isNew && templatePath) {
          const response = await fetch(`/api/get-file-content?repo=${repo}&path=${templatePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) throw new Error(`API Error: Failed to fetch template file (status: ${response.status})`);
          const { content } = await response.json();
          const pageTitle = filePath.split('/').pop().replace('.astro', '').replace(/-/g, ' ');
          fileContent = content.replace(/title\s*=\s*".*?"/, `title="${pageTitle}"`);
          sha = null;
        } else {
          const response = await fetch(`/api/files/get?repo=${repo}&path=${filePath}&ref=${branch}`, { credentials: 'include' });
          if (!response.ok) {
             if (response.status === 404) {
                 throw new Error("File not found. It may not have been saved yet.");
             }
             throw new Error(`API Error: Failed to fetch file (status: ${response.status})`);
          }
          const data = await response.json();
          fileContent = atob(data.content);
          sha = data.sha;
        }

        if (!fileContent) {
          throw new Error("File content is empty.");
        }

        const parsedBlueprint = parseAstroToBlueprint(fileContent);
        if (!parsedBlueprint) {
          throw new Error('Parsing Error: Failed to parse the Astro file. Check for valid markers or syntax errors.');
        }
        setBlueprint(parsedBlueprint);
        setFileSha(sha);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParseFile();
  }, [location.search]);

  const longPressProps = useLongPress(() => openContextMenu(new MouseEvent('contextmenu'), 'some-block-id'));
  const { isDragging, dragOffset, draggableProps } = useDraggable();

  const selectedBlock = blueprint?.preContent.find(b => b.id === selectedBlockId) || blueprint?.postContent.find(b => b.id === selectedBlockId);

  return (
    <div className="bg-gray-100 min-h-screen flex" onClick={() => contextMenu.visible && setContextMenu({ visible: false })}>
      {isDragging && (
        <div
          className="fixed bg-blue-200 border border-blue-500 rounded-md p-2 z-50"
          style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
        >
          Dragging...
        </div>
      )}
      <BlockContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onAction={handleContextMenuAction}
      />
      <div className="flex-grow p-4 sm:p-6 lg:p-8">
        <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 h-16 flex items-center justify-between px-4">
            <Link to="/explorer" className="p-2 rounded-md hover:bg-gray-200">
                <Icon name="Home" />
            </Link>
            <div className="text-center">
                <h1 className="text-lg font-semibold">Visual Editor</h1>
                {builtAtISO && <p className="text-xs text-gray-500">Last built {new Date(builtAtISO).toLocaleTimeString()}</p>}
            </div>
            <Link to="/design" className="p-2 rounded-md hover:bg-gray-200">
                <Icon name="LayoutDashboard" />
            </Link>
        </header>

        <div className="pt-16">
            {isLoading && <p>Loading...</p>}
        </div>

        {(error || previewError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <strong className="font-bold">An error occurred:</strong>
            <p className="block sm:inline ml-2">{error || previewError}</p>
          </div>
        )}

        {stale && !building && (
          <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2 mb-4">
            Preview is out of date. Click “Rebuild Preview” to update.
          </div>
        )}

        {blueprint && (
          <div className="relative h-full">
            <PreviewPane ref={previewIframeRef} filePath={new URLSearchParams(location.search).get('path')} cacheKey={lastRunId || ''} />
            <OverlayCanvas
              previewIframe={previewIframeRef.current}
              onSelectBlock={handleSelectBlock}
              onLongPressBlock={openContextMenu}
            />
          </div>
        )}
      </div>
      <div className="hidden lg:block">
        <VisualSidebar
          blueprint={blueprint}
          setBlueprint={setBlueprint}
          onSave={handleSave}
          onSaveAsLayout={handleSaveAsLayout}
          previewIframe={previewIframeRef.current}
        />
      </div>
      <div className="lg:hidden">
        <MobileQuickBar
          onSave={handleSave}
          onRebuild={triggerBuild}
          rebuildDisabled={rebuildDisabled}
          rebuildCountdown={rebuildCountdown}
          onAdd={() => setEditorMode(EditorModes.Blocks)}
          onDesign={() => setEditorMode(EditorModes.Design)}
        />
        <ComponentsDock
          visible={editorMode === EditorModes.Blocks}
          onAdd={handleAddBlock}
          onClose={() => setEditorMode(EditorModes.None)}
        />
        <DesignSheet
          visible={editorMode === EditorModes.Design}
          onClose={() => setEditorMode(EditorModes.None)}
          values={blueprint?.theme || {}}
          onChange={handleThemeChange}
        />
        <BlockSettingsSheet
          visible={!!selectedBlockId}
          block={selectedBlock}
          onChange={handleBlockChange}
          onClose={() => setSelectedBlockId(null)}
        />
      </div>
    </div>
  );
}

export default VisualEditorPage;
