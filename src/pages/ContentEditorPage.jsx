import { h } from 'preact';
import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { route } from 'preact-router';
import matter from 'gray-matter';
import { useAuth } from '../contexts/AuthContext';
import { fetchJson } from '../lib/fetchJson';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import SectionsEditor from '../components/SectionsEditor';
import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';

export default function ContentEditorPage(props) {
  // --- 1. HOOKS ---
  const { selectedRepo } = useAuth();

  // State Hooks
  const [contentBody, setContentBody] = useState(null); // For Lexical
  const [sections, setSections] = useState(null); // For SectionsEditor
  const [saveStatus, setSaveStatus] = useState('saved');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'preview'
  const [isPreviewBuilding, setIsPreviewBuilding] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());

  // Ref Hooks
  const editorApiRef = useRef(null);
  const filePathRef = useRef(null);

  // --- 2. DERIVED STATE & CONSTANTS ---
  const pathIdentifier = props.filePath ? decodeURIComponent(props.filePath) : (props.pageId || 'home');
  const pageId = pathIdentifier.endsWith('/index.astro')
    ? (pathIdentifier.split('/').slice(-2, -1)[0] || 'home')
    : pathIdentifier.split('/').pop().replace(/\.astro$/, '') || 'home';

  const isTestFile = pathIdentifier.startsWith('src/pages/json-preview/') && pathIdentifier.endsWith('.astro');
  const editorMode = isTestFile ? 'json' : 'astro';

  console.log(`[ContentEditorPage] mode=${editorMode} slug=${pageId} path=${pathIdentifier}`);

  // --- 3. CALLBACKS & HANDLERS ---
  const getDefaultSections = useCallback(() => [
    {
      id: `section-${Date.now()}-1`,
      type: 'hero',
      props: {
        title: 'Placeholder Hero Title',
        subtitle: 'Placeholder hero subtitle text.',
        body: '<p>This is the default body content for the hero section. You can edit this.</p>',
      },
    },
    {
      id: `section-${Date.now()}-2`,
      type: 'textSection',
      props: {
        title: 'Placeholder Text Section',
        body: '<p>This is some default placeholder text for a standard text section.</p>',
        ctaText: 'Learn More',
        ctaHref: '#',
      },
    },
  ], []);

  const autosaveCallback = useCallback((dataToSave) => {
    console.log('[AUTOSAVE-DEBUG] Step 1: autosaveCallback initiated.');
    setSaveStatus('saving');
    try {
      const key = `easy-seo-draft:${pageId}`;
      console.log(`[AUTOSAVE-DEBUG] Step 2: Using localStorage key: "${key}"`);

      const draft = JSON.parse(localStorage.getItem(key) || '{}');
      const payload = { ...draft, slug: pageId, savedAt: new Date().toISOString() };

      if (sections) {
        console.log('[AUTOSAVE-DEBUG] Step 3: Sections mode detected. Saving sections data.');
        payload.sections = dataToSave;
      } else {
        console.log('[AUTOSAVE-DEBUG] Step 3: Astro mode detected. Saving content body.');
        payload.content = dataToSave;
      }

      console.log('[AUTOSAVE-DEBUG] Step 4: Preparing to save payload:', payload);
      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[AUTOSAVE-DEBUG] Step 5: SUCCESS! Draft saved to localStorage.`);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[AUTOSAVE-DEBUG] Step 5: FAILED! An error occurred during the save process.', {
        message: error.message,
        stack: error.stack,
      });
      setSaveStatus('unsaved');
    }
  }, [pageId, sections]);

  const { triggerSave } = useAutosave(autosaveCallback, 1500);

  const triggerBuild = useCallback(async () => {
    console.log('[SYNC-DEBUG] Step 4: triggerBuild function initiated.');
    if (!selectedRepo) {
      console.error('[SYNC-DEBUG] Step 4 FAILED: No selectedRepo found.');
      setIsPreviewBuilding(false);
      return;
    }
    console.log(`[SYNC-DEBUG] Step 4: Repository found: ${selectedRepo.full_name}. Setting isPreviewBuilding=true.`);
    setIsPreviewBuilding(true);
    try {
      const buildPayload = { repo: selectedRepo.full_name };
      console.log('[SYNC-DEBUG] Step 4: Calling /api/trigger-build with payload:', buildPayload);
      const response = await fetchJson('/api/trigger-build', {
        method: 'POST',
        body: JSON.stringify(buildPayload),
      });
      console.log('[SYNC-DEBUG] Step 4 SUCCESS: Build trigger API call successful. Response:', response);
    } catch (error) {
      console.error('[SYNC-DEBUG] Step 4 FAILED: API call to /api/trigger-build threw an error.', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      setIsPreviewBuilding(false);
    }
  }, [selectedRepo]);

  const handleLexicalChange = useCallback((newContent) => {
    setContentBody(newContent);
    setSaveStatus('unsaved');
    triggerSave(newContent);
  }, [triggerSave]);

  const handleSectionsChange = useCallback((newSections) => {
    setSections(newSections);
    setSaveStatus('unsaved');
    triggerSave(newSections);
  }, [triggerSave]);

  const handleAddSection = useCallback(() => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: 'textSection',
      props: { title: 'New Section', body: '<p>Start writing your content here.</p>', ctaText: '', ctaHref: '' },
    };
    const newSections = [...(sections || []), newSection];
    setSections(newSections);
    triggerSave(newSections);
  }, [sections, triggerSave]);

  const handlePreview = useCallback(() => {
    setViewMode(prevMode => prevMode === 'editor' ? 'preview' : 'editor');
  }, []);

  const handleRefreshPreview = useCallback(() => {
    console.log('[Preview] Manual refresh triggered.');
    setPreviewKey(Date.now());
    setIsPreviewBuilding(false); // Hide the overlay on manual refresh
  }, []);

  const handleSync = useCallback(async () => {
    console.log('[SYNC-DEBUG] Step 1: handleSync initiated.');
    setSyncStatus('syncing');

    if (!selectedRepo) {
      console.error('[SYNC-DEBUG] Step 1 FAILED: No selectedRepo. Aborting.');
      setSyncStatus('error');
      return;
    }
    console.log(`[SYNC-DEBUG] Step 1: Found repo: ${selectedRepo.full_name}`);

    try {
      const draftKey = `easy-seo-draft:${pageId}`;
      console.log(`[SYNC-DEBUG] Step 2: Reading from localStorage with key: "${draftKey}"`);
      const savedDraft = localStorage.getItem(draftKey);

      if (!savedDraft) {
        console.error('[SYNC-DEBUG] Step 2 FAILED: No local draft found in localStorage.');
        throw new Error('No local draft found to sync.');
      }
      console.log('[SYNC-DEBUG] Step 2: Found draft in localStorage.');

      const draftData = JSON.parse(savedDraft);
      if (editorMode !== 'json' || !draftData.sections) {
        console.error(`[SYNC-DEBUG] Step 2 FAILED: Sync is not supported. editorMode=${editorMode}, hasSections=${!!draftData.sections}`);
        throw new Error('Sync is currently only supported for JSON-mode pages with sections.');
      }

      const savePayload = {
        repo: selectedRepo.full_name,
        pageData: {
          slug: draftData.slug,
          meta: draftData.meta || { title: draftData.slug },
          sections: draftData.sections,
        },
      };
      console.log('[SYNC-DEBUG] Step 3: Prepared payload for API call:', savePayload);

      const response = await fetchJson('/api/page-json/update', { method: 'POST', body: JSON.stringify(savePayload) });
      console.log('[SYNC-DEBUG] Step 3 SUCCESS: API call to /api/page-json/update was successful. Response:', response);

      triggerBuild(); // This is Step 4

      console.log('[SYNC-DEBUG] Step 5: Setting sync status to "success".');
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2500);

    } catch (error) {
      console.error('[SYNC-DEBUG] A critical error occurred during the sync process.', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      setSyncStatus('error');
    }
  }, [selectedRepo, pageId, editorMode, triggerBuild]);

  // --- 4. SIDE EFFECTS (useEffect) ---
  useEffect(() => {
    console.log('[ContentEditor] useEffect running...');
    try {
      filePathRef.current = pathIdentifier.startsWith('src/pages/') ? pathIdentifier : `src/pages/${pathIdentifier}`;

      const loadJsonModeContent = async () => {
        const draftKey = `easy-seo-draft:${pageId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          console.log('[ContentEditor-JSON] Found local draft. Loading from localStorage.');
          try {
            const draft = JSON.parse(savedDraft);
            setSections(draft.sections || getDefaultSections());
          } catch (e) {
            console.error('[ContentEditor-JSON] Failed to parse draft. Loading default.', e);
            setSections(getDefaultSections());
          }
          return;
        }

        console.log('[ContentEditor-JSON] No local draft. Fetching from repository...');
        const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
        try {
          const url = `/api/page-json?repo=${encodeURIComponent(repo)}&slug=${encodeURIComponent(pageId)}`;
          const pageJson = await fetchJson(url);
          setSections(pageJson.sections || getDefaultSections());
        } catch (error) {
          if (error.message.includes('404')) {
            console.log('[ContentEditor-JSON] No remote JSON found. Initializing with default sections.');
          } else {
            console.error('[ContentEditor-JSON] Failed to fetch remote JSON. Falling back to default.', error);
          }
          setSections(getDefaultSections());
        }
      };

      const loadAstroModeContent = async () => {
        const draftKey = `easy-seo-draft:${pageId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          console.log('[ContentEditor-Astro] Found local draft. Loading from localStorage.');
          const draft = JSON.parse(savedDraft);
          if (draft.sections) {
            setSections(draft.sections);
            return;
          }
          setContentBody(draft.content || '');
          return;
        }

        console.log('[ContentEditor-Astro] No local draft. Fetching file from repository...');
        const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
        const path = filePathRef.current;
        try {
          const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;
          const json = await fetchJson(url);
          const decodedContent = atob(json.content || '');
          const { data: frontmatter, content: body } = matter(decodedContent);

          if (frontmatter && frontmatter.sections && Array.isArray(frontmatter.sections)) {
            setSections(frontmatter.sections);
          } else {
            setContentBody(body);
          }
        } catch (error) {
          console.error('[ContentEditor-Astro] Failed to fetch or parse file content:', error);
          setContentBody('// Error loading content. Please try again.');
        }
      };

      if (editorMode === 'json') {
        loadJsonModeContent();
      } else {
        loadAstroModeContent();
      }

    } catch (e) {
      console.error('[ContentEditor] useEffect crash:', e);
    }
  }, [pageId, selectedRepo, editorMode, triggerBuild, getDefaultSections]);

  // --- 5. RENDER LOGIC ---
  const generatePreviewPath = (path) => {
    console.log(`[PREVIEW-URL-GEN] Input path: "${path}"`);
    let result = path;

    if (result.startsWith('src/pages/')) {
      result = result.substring('src/pages/'.length);
    }

    if (result.endsWith('.astro')) {
      result = result.slice(0, -'.astro'.length);
    }

    if (result.endsWith('index')) {
      result = result.slice(0, -'index'.length);
    }

    // Astro treats paths without extensions as directories, so they need a trailing slash.
    // The root path (from 'index') correctly becomes an empty string and does not get a slash.
    if (result.length > 0 && !result.endsWith('/')) {
      result += '/';
    }

    console.log(`[PREVIEW-URL-GEN] Final generated path: "${result}"`);
    return result;
  };

  const previewPath = generatePreviewPath(pathIdentifier);
  const previewUrl = `https://strategycontent.pages.dev/${previewPath}`;
  console.log(`[DEBUG-PREVIEW] Final preview URL: ${previewUrl}`);

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-white">
      <EditorHeader editorApiRef={editorApiRef} />
      <main class="flex-grow overflow-y-auto" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {viewMode === 'editor' ? (
          <div class="w-full">
            {sections ? (
              <SectionsEditor sections={sections} onChange={handleSectionsChange} />
            ) : contentBody !== null ? (
              <LexicalEditor
                ref={editorApiRef}
                slug={pageId}
                initialContent={contentBody}
                onChange={handleLexicalChange}
              />
            ) : (
              <div>Loading Editor...</div>
            )}
          </div>
        ) : (
          <div class="w-full h-full bg-white relative">
            {isPreviewBuilding && (
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div class="text-white text-center">
                  <RefreshCw size={48} className="animate-spin mb-4 mx-auto" />
                  <p class="text-lg font-semibold">Fetching preview...</p>
                  <p class="text-sm">This may take a moment.</p>
                </div>
              </div>
            )}
            <button
              onClick={handleRefreshPreview}
              className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-75 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Refresh Preview"
            >
              <RefreshCw size={24} />
            </button>
            <iframe
              key={previewKey}
              src={previewUrl}
              title="Live Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </main>
      <BottomActionBar
        saveStatus={saveStatus}
        syncStatus={syncStatus}
        viewMode={viewMode}
        onAdd={handleAddSection}
        onSync={handleSync}
        onPreview={editorMode === 'json' ? handlePreview : null}
      />
    </div>
  );
}
