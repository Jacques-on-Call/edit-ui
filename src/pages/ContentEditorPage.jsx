import { h } from 'preact';
import { useEffect, useState, useRef, useCallback, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import matter from 'gray-matter';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { EditorProvider } from '../contexts/EditorContext'; // <-- IMPORT THE PROVIDER
import { fetchJson } from '../lib/fetchJson';
import { calculatePageScore } from '../lib/pageScoring';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import SectionsEditor from '../components/SectionsEditor';
import EditorHeader from '../components/EditorHeader';
import BottomActionBar from '../components/BottomActionBar';
import AddSectionModal from '../components/AddSectionModal';
import { Home, Plus, UploadCloud, RefreshCw } from 'lucide-preact';

// Constants
const STATUS_DISPLAY_DURATION = 2500; // Time in ms to display sync status before resetting

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
  const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'livePreview'
  const [isPreviewBuilding, setIsPreviewBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(''); // To hold the current build stage text
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [buildError, setBuildError] = useState(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState(null); // Track which section is being edited

  // Ref Hooks
  // const editorApiRef = useRef(null); // No longer needed for the header
  const filePathRef = useRef(null);
  const iframeRef = useRef(null);
  // Use ref for selectedRepo to avoid recreating callbacks on every render
  const selectedRepoRef = useRef(selectedRepo);
  // Track the last synced content to avoid unnecessary builds
  const lastSyncedContentRef = useRef(null);
  // Track the last build time to prevent unnecessary rebuilds within a cache window
  const lastBuildTimeRef = useRef(null);
  // Build cache duration: skip rebuild if content unchanged and within this time window
  const BUILD_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
          // Record successful build time for cache window
          lastBuildTimeRef.current = Date.now();
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
      if (config.textColor) newSection.props.textColor = config.textColor;
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

  const handleEditSection = useCallback((index) => {
    console.log('[ContentEditorPage] handleEditSection called', { index });
    setEditingSectionIndex(index);
    openAddSectionModal();
  }, [openAddSectionModal]);

  const handleUpdateSection = useCallback(async (updatedSection) => {
    console.log('[ContentEditorPage] handleUpdateSection called', { updatedSection });
    if (editingSectionIndex === null) return;

    // Helper function to get SHA for a specific image path
    const getImageSha = async (imagePath) => {
      if (!imagePath) return null;
      try {
        const repo = selectedRepoRef.current.full_name;
        const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(imagePath)}`;
        const { sha } = await fetchJson(url);
        return sha;
      } catch (error) {
        console.error('Failed to get SHA for image:', imagePath, error);
        return null;
      }
    };

    // Helper function to rename an image
    const renameImage = async (originalPath, newPath) => {
      if (!originalPath || !newPath || originalPath === newPath) {
        return newPath;
      }
      
      console.log('[ContentEditorPage] Renaming image:', { originalPath, newPath });
      
      // Get the SHA for the original file
      const sha = await getImageSha(originalPath);
      if (!sha) {
        console.error('Could not get SHA for image rename:', originalPath);
        throw new Error(`Could not get SHA for image: ${originalPath}`);
      }
      
      const newFilename = newPath.split('/').pop();
      
      await fetchJson('/api/files/rename', {
        method: 'POST',
        body: JSON.stringify({
          repo: selectedRepoRef.current.full_name,
          path: originalPath,
          newFilename: newFilename,
          sha: sha,
        }),
      });
      
      // Return the new path (with same directory as original, but new filename)
      return originalPath.replace(/[^/]*$/, newFilename);
    };

    try {
      // Handle feature image rename if original path is tracked
      if (updatedSection.props._originalFeatureImagePath && updatedSection.props.featureImageUrl) {
        const newPath = await renameImage(
          updatedSection.props._originalFeatureImagePath,
          updatedSection.props.featureImageUrl
        );
        // Update both featureImage and featureImageUrl to ensure consistency
        // HeroEditor uses both: props?.featureImage || props?.featureImageUrl
        updatedSection.props.featureImage = newPath;
        updatedSection.props.featureImageUrl = newPath;
        delete updatedSection.props._originalFeatureImagePath;
      }
      
      // Handle background image rename if original path is tracked
      if (updatedSection.props._originalBackgroundImagePath && updatedSection.props.backgroundImageUrl) {
        const newPath = await renameImage(
          updatedSection.props._originalBackgroundImagePath,
          updatedSection.props.backgroundImageUrl
        );
        updatedSection.props.backgroundImageUrl = newPath;
        delete updatedSection.props._originalBackgroundImagePath;
      }
      
      // Handle header image rename if original path is tracked
      if (updatedSection.props._originalHeaderImagePath && updatedSection.props.headerImageUrl) {
        const newPath = await renameImage(
          updatedSection.props._originalHeaderImagePath,
          updatedSection.props.headerImageUrl
        );
        // Update both featureImage and headerImageUrl to ensure consistency
        // BodySectionEditor uses: props?.featureImage || props?.headerImageUrl
        updatedSection.props.featureImage = newPath;
        updatedSection.props.headerImageUrl = newPath;
        delete updatedSection.props._originalHeaderImagePath;
      }
    } catch (error) {
      // Log detailed error information for debugging
      const failedImages = [];
      if (updatedSection.props._originalFeatureImagePath) {
        failedImages.push(`feature image: ${updatedSection.props._originalFeatureImagePath}`);
      }
      if (updatedSection.props._originalBackgroundImagePath) {
        failedImages.push(`background image: ${updatedSection.props._originalBackgroundImagePath}`);
      }
      if (updatedSection.props._originalHeaderImagePath) {
        failedImages.push(`header image: ${updatedSection.props._originalHeaderImagePath}`);
      }
      console.error(`Failed to rename image(s): ${failedImages.join(', ')}`, {
        error: error.message,
        sectionType: updatedSection.type,
        sectionId: updatedSection.id
      });
      // Continue with the update even if rename fails - user can try again
      // Remove the _original tracking properties to prevent confusion
      delete updatedSection.props._originalFeatureImagePath;
      delete updatedSection.props._originalBackgroundImagePath;
      delete updatedSection.props._originalHeaderImagePath;
    }

    const newSections = [...(sections || [])];
    newSections[editingSectionIndex] = updatedSection;

    setSections(newSections);
    triggerSave(newSections);
    setEditingSectionIndex(null); // Reset after update
  }, [sections, editingSectionIndex, triggerSave]);

  const handleSync = useCallback(async () => {
    console.log(`[CEP-handleSync] Sync process initiated.`);
    if (!selectedRepo) {
      console.error('[CEP-handleSync] Aborting: repository not selected.');
      setSyncStatus('error');
      return;
    }

    // Prevent multiple sync operations at once
    if (syncStatus === 'syncing' || isPreviewBuilding) {
      console.log('[CEP-handleSync] Sync already in progress, ignoring duplicate request.');
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

      // Store the synced content to compare later
      lastSyncedContentRef.current = savedDraft;

      setIsPreviewBuilding(true);
      // Don't auto-switch to preview mode - let user decide when to view preview
      // setViewMode('preview'); // Removed: Clicking Sync should not force preview mode

      console.log('[CEP-handleSync] Triggering site build...');
      triggerBuild();
      console.log('[CEP-handleSync] Build triggered.');

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), STATUS_DISPLAY_DURATION);
    } catch (error) {
      console.error('[CEP-handleSync] Sync process failed.', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), STATUS_DISPLAY_DURATION);
    }
  }, [selectedRepo, pageId, editorMode, triggerBuild, syncStatus, isPreviewBuilding]);

  const handlePreview = useCallback(async () => {
    // If we're in a preview mode, switch back to the editor
    if (viewMode !== 'editor') {
      setViewMode('editor');
      return;
    }

    // Prevent action if a build is already in progress
    if (isPreviewBuilding) {
      console.log('[CEP-handlePreview] Build already in progress, switching to preview view.');
      setViewMode('livePreview');
      return;
    }

    // Check if content has changed since the last sync
    const draftKey = `easy-seo-draft:${pageId}`;
    const currentDraft = localStorage.getItem(draftKey);
    const contentUnchanged = currentDraft && lastSyncedContentRef.current === currentDraft;
    
    // Check if we're within the build cache window
    const timeSinceLastBuild = Date.now() - (lastBuildTimeRef.current || 0);
    const withinCacheWindow = timeSinceLastBuild < BUILD_CACHE_DURATION;

    // If content hasn't changed AND we're within the cache window, skip the build
    if (contentUnchanged && withinCacheWindow) {
      console.log('[CEP-handlePreview] Content unchanged and within cache window, showing cached preview.');
      // Just switch to preview mode without rebuilding or refreshing iframe
      setViewMode('livePreview');
      return;
    }
    
    // If content unchanged but outside cache window, just refresh the iframe
    if (contentUnchanged) {
      console.log('[CEP-handlePreview] Content unchanged since last sync, refreshing preview without new build.');
      setPreviewKey(Date.now());
      setViewMode('livePreview');
      return;
    }

    // Content has changed or hasn't been synced yet - trigger sync and build
    try {
      await handleSync();
      setViewMode('livePreview');
    } catch (error) {
      console.error('[CEP-handlePreview] Error during preview sync:', error);
      // Still show preview even if sync failed - user can see the last deployed version
      setPreviewKey(Date.now());
      setViewMode('livePreview');
    }
  }, [viewMode, handleSync, pageId, isPreviewBuilding]);

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
          // Decode base64 content with proper UTF-8 handling
          const binaryString = atob(json.content || '');
          const decodedContent = decodeURIComponent(escape(binaryString));
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
  
  // Calculate Page Score based on current sections
  const pageScoreData = useMemo(() => {
    if (!sections || sections.length === 0) {
      return { total: 0 };
    }
    return calculatePageScore({ sections, meta: {} });
  }, [sections]);

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
            <SectionsEditor sections={sections} onChange={handleSectionsChange} onEdit={handleEditSection} />
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

    // Live preview mode - clean iframe without overlay labels (moved to bottom bar)
    return (
      <div class="w-full bg-white relative" style={{ height: 'calc(100dvh - 64px)' }}>
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
        <iframe
          id="content-preview-iframe"
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
      <div class="flex flex-col h-full bg-transparent text-white relative overflow-y-auto">
        {/* Only show editor header when in editor mode, hide in preview modes */}
        {viewMode === 'editor' && <EditorHeader />}
        <main class="flex-grow relative" style={{
          paddingTop: 'var(--header-h)',
          paddingBottom: 'var(--action-bar-height, calc(64px + env(safe-area-inset-bottom, 0px)))'
        }}>
          <div class="h-full">
            {renderContent()}
          </div>
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
          sectionToEdit={editingSectionIndex !== null ? sections[editingSectionIndex] : null}
          onUpdateSection={handleUpdateSection}
        />
      </div>
    </EditorProvider>
  );
}
