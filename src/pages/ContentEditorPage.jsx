import { h } from 'preact';
import { useEffect, useState, useRef, useCallback, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import matter from 'gray-matter';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { EditorProvider } from '../contexts/EditorContext'; // <-- IMPORT THE PROVIDER
import { fetchJson } from '../lib/fetchJson';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import SectionsEditor from '../components/SectionsEditor';
import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import AddSectionModal from '../components/AddSectionModal';
import LocalPreview from '../components/LocalPreview';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';

export default function ContentEditorPage(props) {
  console.log('[CEP] Component Init', { props });
  // --- 1. HOOKS ---
  const { selectedRepo } = useAuth();
  const { openAddSectionModal } = useUI();

  // State Hooks
  const [contentBody, setContentBody] = useState(null); // For Lexical
  const [sections, setSections] = useState(null); // For SectionsEditor
  const [saveStatus, setSaveStatus] = useState('saved');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [viewMode, setViewMode] = useState('editor'); // 'editor', 'localPreview', or 'livePreview'
  const [isPreviewBuilding, setIsPreviewBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(''); // To hold the current build stage text
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [buildError, setBuildError] = useState(null);

  // Ref Hooks
  // const editorApiRef = useRef(null); // No longer needed for the header
  const filePathRef = useRef(null);
  const iframeRef = useRef(null);
  // Use ref for selectedRepo to avoid recreating callbacks on every render
  const selectedRepoRef = useRef(selectedRepo);

  // Keep selectedRepoRef in sync with selectedRepo state
  useEffect(() => {
    selectedRepoRef.current = selectedRepo;
  }, [selectedRepo]);

  // Debug render only in development - commented out to reduce console spam
  // console.log('[ContentEditorPage] RENDER - syncStatus:', syncStatus, 'isPreviewBuilding:', isPreviewBuilding);

  // --- 2. DERIVED STATE & CONSTANTS ---
  const pathIdentifier = props.filePath ? decodeURIComponent(props.filePath) : (props.pageId || 'home');
  const pageId = pathIdentifier.endsWith('/index.astro')
    ? (pathIdentifier.split('/').slice(-2, -1)[0] || 'home')
    : pathIdentifier.split('/').pop().replace(/\.astro$/, '') || 'home';

  const isTestFile = pathIdentifier.startsWith('src/pages/json-preview/') && pathIdentifier.endsWith('.astro');
  const editorMode = isTestFile ? 'json' : 'astro';

  // Debug mode logging - only log once per unique combination to reduce spam
  console.log(`[CEP] Derived State: mode=${editorMode} slug=${pageId} path=${pathIdentifier}`);

  // --- 3. CALLBACKS & HANDLERS ---
  // getDefaultSections uses empty dependency array for stable reference
  const getDefaultSections = useCallback(() => [
    {
      id: `section-${Date.now()}-1`,
      type: 'hero',
      props: {
        title: '',
        subtitle: '',
        body: '',
      },
    },
    {
      id: `section-${Date.now()}-2`,
      type: 'textSection',
      props: {
        title: '',
        body: '',
        ctaText: '',
        ctaHref: '',
      },
    },
  ], []);

  const autosaveCallback = useCallback((dataToSave) => {
    setSaveStatus('saving');
    try {
      const key = `easy-seo-draft:${pageId}`;
      const draft = JSON.parse(localStorage.getItem(key) || '{}');
      const payload = { ...draft, slug: pageId, savedAt: new Date().toISOString() };

      if (sections) {
        payload.sections = dataToSave;
      } else {
        payload.content = dataToSave;
      }

      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[ContentEditor] Draft successfully saved to key: ${key}`);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[ContentEditor] Failed to autosave draft:', error);
      setSaveStatus('unsaved');
    }
  }, [pageId, sections]);

  const { triggerSave } = useAutosave(autosaveCallback, 1500);

  const pollBuildStatus = useCallback(async (startTime = Date.now()) => {
    const POLLING_INTERVAL = 5000; // 5 seconds (increased from 3s for more reliable polling)
    const TIMEOUT = 120000; // 2 minutes

    if (Date.now() - startTime > TIMEOUT) {
      console.error('[Build] Polling timed out after 2 minutes.');
      setIsPreviewBuilding(false);
      setBuildError('The live preview build took too long. Please try refreshing the preview manually.');
      return;
    }

    try {
      const data = await fetchJson('/api/check-build-status');
      console.log(`[Build Poll] Status: ${data.status}, Stage: ${data.stage}`);
      setBuildStage(data.stage || 'Initializing...'); // Update the build stage state

      if (data.status === 'success') {
        console.log('[Build] Build successful! Waiting 2s before refreshing preview.');
        setBuildStage('Finalizing...');

        // Wait 2 seconds before refreshing to allow deployment to propagate
        setTimeout(() => {
          console.log('[Build] Refreshing preview now.');
          setIsPreviewBuilding(false);
          setBuildError(null);
          setBuildStage('Success!');
          // Force iframe reload by updating the previewKey.
          // The useMemo hook for previewUrl will handle the cache-busting.
          setPreviewKey(Date.now());
        }, 2000);
      } else if (data.status === 'failure' || data.status === 'canceled') {
        console.error('[Build] Build failed or was canceled.');
        setIsPreviewBuilding(false);
        setBuildStage('');
        setBuildError(`The live preview build failed with status: ${data.status}.`);
      } else {
        // If status is 'active' or another ongoing state, poll again
        setTimeout(() => pollBuildStatus(startTime), POLLING_INTERVAL);
      }
    } catch (error) {
      console.error('[Build Poll] Error fetching build status:', error);
      console.error('[Build Poll] Full error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      setIsPreviewBuilding(false);
      setBuildError('Could not check the build status. Please try refreshing the preview manually.');
    }
  }, []);

  const triggerBuild = useCallback(async () => {
    console.log(`[Build] triggerBuild called at ${new Date().toISOString()}`);
    const repo = selectedRepoRef.current;
    if (!repo) {
      console.warn('[Build] Cannot trigger build: repository not selected.');
      return;
    }

    console.log('[Build] Triggering background build...');
    setIsPreviewBuilding(true);
    setBuildStage('Queued...'); // Set initial stage
    setBuildError(null); // Clear previous errors

    try {
      const buildPayload = { repo: repo.full_name };
      await fetchJson('/api/trigger-build', {
        method: 'POST',
        body: JSON.stringify(buildPayload),
      });
      console.log('[Build] Build trigger API call successful. Starting to poll for status.');
      // Start the polling loop
      pollBuildStatus();
    } catch (error) {
      console.error('[Build] Failed to trigger build:', error);
      setIsPreviewBuilding(false);
      setBuildError('Failed to start the live preview build.');
    }
  }, [pollBuildStatus]);

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

  const handleAddSection = useCallback((type, config) => {
    console.log('[ContentEditorPage] handleAddSection called', { type, config });
    const newSection = {
      id: `section-${Date.now()}`,
      type: type,
      props: {},
    };

    if (type === 'hero') {
      newSection.props.title = 'New Hero Title';
      if (config.includeSlogan) newSection.props.subtitle = 'New Slogan';
      if (config.includeBody) newSection.props.body = '<p>New body paragraph.</p>';
      if (config.includeFeatureImage) newSection.props.featureImageUrl = config.featureImageUrl;
      if (config.includeBackgroundImage) newSection.props.backgroundImageUrl = config.backgroundImageUrl;
    } else if (type === 'textSection') {
      if (config.includeTitle) newSection.props.title = 'New Section Title';
      newSection.props.body = '<p>Start writing your content here.</p>';
      if (config.includeHeaderImage) {
        newSection.props.headerImageUrl = config.headerImageUrl;
        newSection.props.headerImageAlt = config.headerImageAlt;
      }
    }

    const newSections = [...(sections || []), newSection];
    setSections(newSections);
    triggerSave(newSections);
  }, [sections, triggerSave]);

  const handleSync = useCallback(async () => {
    console.log(`[CEP-handleSync] Sync process initiated.`);
    if (!selectedRepo) {
      console.error('[CEP-handleSync] Aborting: repository not selected.');
      setSyncStatus('error');
      return;
    }
    setSyncStatus('syncing');
    console.log('[CEP-handleSync] Status set to "syncing". Reading draft from localStorage...');
    try {
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (!savedDraft) {
        console.error('[CEP-handleSync] No local draft found to sync.');
        throw new Error('No local draft found to sync.');
      }

      const draftData = JSON.parse(savedDraft);
      if (editorMode !== 'json' || !draftData.sections) {
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

      // Log sanitized payload info (exclude actual content for security)
      console.log('[CEP-handleSync] Payload prepared. Calling API endpoint.', {
        repo: savePayload.repo,
        slug: savePayload.pageData.slug,
        sectionCount: savePayload.pageData.sections?.length || 0,
      });
      await fetchJson('/api/page-json/update', { method: 'POST', body: JSON.stringify(savePayload) });
      console.log('[CEP-handleSync] API call successful. Content saved.');

      setIsPreviewBuilding(true);
      // Don't auto-switch to preview mode - let user decide when to view preview
      // setViewMode('preview'); // Removed: Clicking Sync should not force preview mode
      
      console.log('[CEP-handleSync] Triggering site build...');
      triggerBuild();
      console.log('[CEP-handleSync] Build triggered.');

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2500);
    } catch (error) {
      console.error('[CEP-handleSync] Sync process failed.', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      setSyncStatus('error');
    }
  }, [selectedRepo, pageId, editorMode, triggerBuild]);

  const handlePreview = useCallback(async () => {
    // If we're in the editor, sync and then switch to the live preview
    if (viewMode === 'editor') {
      // handleSync will save the latest draft and trigger the build.
      // It also sets isPreviewBuilding to true, which will show the overlay.
      await handleSync();
      setViewMode('livePreview');
    } else {
      // If we're in any preview mode, switch back to the editor
      setViewMode('editor');
    }
  }, [viewMode, handleSync]);

  const handleRefreshPreview = useCallback(() => {
    console.log('[Preview] Manual refresh triggered.');
    setPreviewKey(Date.now());
    setIsPreviewBuilding(false); // Hide the overlay on manual refresh
  }, []);

  // --- 4. SIDE EFFECTS (useEffect) ---
  useEffect(() => {
    console.log('[CEP-useEffect] Main effect hook started.');
    try {
      filePathRef.current = pathIdentifier.startsWith('src/pages/') ? pathIdentifier : `src/pages/${pathIdentifier}`;
      console.log('[CEP-useEffect] Resolved file path:', filePathRef.current);

      const loadJsonModeContent = async () => {
        const draftKey = `easy-seo-draft:${pageId}`;
        const savedDraft = localStorage.getItem(draftKey);
        console.log(`[CEP-useEffect] Checking for draft in localStorage. Key: ${draftKey}`);

        if (savedDraft) {
          console.log('[CEP-useEffect] Local draft found. Parsing and loading.');
          try {
            const draft = JSON.parse(savedDraft);
            setSections(draft.sections || getDefaultSections());
            console.log('[CEP-useEffect] Successfully loaded sections from draft.');
          } catch (e) {
            console.error('[CEP-useEffect] Failed to parse draft. Loading default sections.', { error: e });
            setSections(getDefaultSections());
          }
          return;
        }

        console.log('[CEP-useEffect] No local draft. Attempting to fetch from repository...');
        const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
        try {
          const url = `/api/page-json?repo=${encodeURIComponent(repo)}&slug=${encodeURIComponent(pageId)}`;
          console.log('[CEP-useEffect] Fetching from URL:', url);
          const pageJson = await fetchJson(url);
          console.log('[CEP-useEffect] Successfully fetched JSON data.');
          const fetchedSections = pageJson.sections || getDefaultSections();
          setSections(fetchedSections);

          // Save fetched content as the initial draft so sync can find it
          const draftPayload = {
            slug: pageId,
            meta: pageJson.meta || { title: pageId },
            sections: fetchedSections,
            path: filePathRef.current,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(draftKey, JSON.stringify(draftPayload));
          console.log('[CEP-useEffect] Saved fetched content as initial draft.');
        } catch (error) {
          if (error.message.includes('404')) {
            console.log('[CEP-useEffect] No remote file found (404). Initializing with default sections.');
          } else {
            console.error('[CEP-useEffect] Failed to fetch remote JSON. Falling back to default sections.', { error });
          }
          const defaultSections = getDefaultSections();
          setSections(defaultSections);

          // Save default sections as initial draft so sync can find it
          const draftPayload = {
            slug: pageId,
            meta: { title: pageId },
            sections: defaultSections,
            path: filePathRef.current,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(draftKey, JSON.stringify(draftPayload));
          console.log('[ContentEditor-JSON] Default content saved as initial draft:', draftKey);
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
      console.error('[CEP-useEffect] CRITICAL: The main useEffect hook crashed.', { error: e });
    }
    // Dependencies: Only use primitive values to prevent re-runs when callbacks are recreated
    // getDefaultSections is stable (empty deps), but we inline calls anyway for safety
    // selectedRepo?.full_name extracts the primitive string value from the object
  }, [pageId, selectedRepo?.full_name, editorMode]);

  // --- 5. RENDER LOGIC ---
  const previewUrl = useMemo(() => {
    const generatePreviewPath = (path) => {
      // Console logs removed to reduce spam - they were firing on every memo check
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

      if (result.length > 0 && !result.endsWith('/')) {
        result += '/';
      }

      return result;
    };

    const previewPath = generatePreviewPath(pathIdentifier);
    // Add the previewKey as a cache-busting query parameter
    const finalUrl = `https://strategycontent.pages.dev/${previewPath}?_t=${previewKey}`;
    return finalUrl;
  }, [pathIdentifier, previewKey]);

  // Render the appropriate view based on viewMode
  const renderContent = () => {
    if (viewMode === 'editor') {
      return (
        <div class="w-full">
          {sections ? (
            <SectionsEditor sections={sections} onChange={handleSectionsChange} />
          ) : contentBody !== null ? (
            <LexicalEditor
              // This is the legacy editor for 'astro' mode.
              // It's not connected to the context for now.
              ref={useRef(null)} // Pass a dummy ref
              slug={pageId}
              initialContent={contentBody}
              onChange={handleLexicalChange}
            />
          ) : (
            <div>Loading Editor...</div>
          )}
        </div>
      );
    }

    if (viewMode === 'localPreview') {
      return (
        <div class="w-full h-full relative">
          <div class="absolute top-4 left-4 z-20 bg-gray-800 bg-opacity-90 text-white px-3 py-1 rounded text-sm">
            Local Preview (instant, before sync)
          </div>
          <LocalPreview sections={sections} />
        </div>
      );
    }

    // Live preview mode
    return (
      <div class="w-full h-full bg-white relative">
        {isPreviewBuilding && (
          <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div class="text-white text-center p-4">
              <RefreshCw size={48} className="animate-spin mb-4 mx-auto" />
              <p class="text-lg font-semibold">
                {buildStage.charAt(0).toUpperCase() + buildStage.slice(1)}
              </p>
              <p class="text-sm">Your changes are being deployed. This may take a minute.</p>
            </div>
          </div>
        )}
        {buildError && (
          <div class="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
            <div class="text-white text-center p-4 bg-red-800 rounded-lg shadow-lg">
              <p class="text-lg font-semibold">Build Error</p>
              <p class="text-sm mt-2">{buildError}</p>
              <button
                onClick={() => setBuildError(null)}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div class="absolute top-4 left-4 z-20 bg-gray-800 bg-opacity-90 text-white px-3 py-1 rounded text-sm">
          Live Preview (from deployed site)
        </div>
        <button
          onClick={handleRefreshPreview}
          className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-75 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Refresh Preview"
        >
          <RefreshCw size={24} />
        </button>
        <iframe
          ref={iframeRef}
          key={previewKey}
          src={previewUrl}
          title="Live Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  };

  return (
    <EditorProvider> {/* <-- WRAP WITH PROVIDER */}
      <div class="flex flex-col h-full bg-transparent text-white">
        <EditorHeader /> {/* <-- REMOVED editorApiRef prop */}
        <main class="flex-grow overflow-y-auto" style={{ paddingBottom: 'calc(64px + 1rem + env(safe-area-inset-bottom))' }}>
          <div style={{ paddingTop: 'var(--header-h)' }}>
            {renderContent()}
          </div>
        </main>
        <BottomActionBar
          saveStatus={saveStatus}
          syncStatus={syncStatus}
          viewMode={viewMode}
          onAdd={openAddSectionModal}
          onPreview={editorMode === 'json' ? handlePreview : null}
        />
        <AddSectionModal pageSlug={pageId} onAddSection={handleAddSection} />
      </div>
    </EditorProvider>
  );
}
