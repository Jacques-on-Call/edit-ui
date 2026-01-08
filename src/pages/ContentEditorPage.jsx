import { h } from 'preact';
import { useEffect, useState, useRef, useCallback, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import matter from 'gray-matter';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { EditorProvider } from '../contexts/EditorContext';
import { fetchJson } from '../lib/fetchJson';
import '../styles/editor.css';
import { calculatePageScore } from '../lib/pageScoring';
import useAutosave from '../hooks/useAutosave';
import LexicalEditor from '../components/LexicalEditor';
import SectionsEditor from '../components/SectionsEditor';
import EditorCanvas from '../components/EditorCanvas';
import { RefreshCw } from 'lucide-preact';
import { lexicalToHtml } from '../utils/lexicalToHtml';

// Constants
const STATUS_DISPLAY_DURATION = 2500; // Time in ms to display sync status before resetting

export default function ContentEditorPage(props) {
  console.log('[CEP] Component Init', { props });
  // --- 1.  HOOKS ---
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
  const [needsDeployment, setNeedsDeployment] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [dynamicPreviewUrl, setDynamicPreviewUrl] = useState('');

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

  // Temporary diagnostic logging for visual viewport
  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      const logViewport = () => {
        console.log('[CEP Viewport] Viewport changed:', {
          width: vv.width,
          height: vv.height,
          offsetLeft: vv.offsetLeft,
          offsetTop: vv.offsetTop,
          pageLeft: vv.pageLeft,
          pageTop: vv.pageTop,
          scale: vv.scale,
        });
      };

      console.log('[CEP Viewport] Attaching viewport listeners.');
      vv.addEventListener('resize', logViewport);
      vv.addEventListener('scroll', logViewport);

      // Log initial state
      logViewport();

      return () => {
        console.log('[CEP Viewport] Removing viewport listeners.');
        vv.removeEventListener('resize', logViewport);
        vv.removeEventListener('scroll', logViewport);
      };
    }
  }, []);

  // Debug render only in development - commented out to reduce console spam
  // console.log('[ContentEditorPage] RENDER - syncStatus:', syncStatus, 'isPreviewBuilding:', isPreviewBuilding);

  // --- 2. DERIVED STATE & CONSTANTS ---
  const pathIdentifier = props.filePath ?  decodeURIComponent(props.filePath) : (props.pageId || 'home');
  const pageId = (pathIdentifier.endsWith('/index.astro') || pathIdentifier.endsWith('/index.json'))
    ? (pathIdentifier.split('/').slice(-2, -1)[0] || 'home')
    : pathIdentifier.split('/').pop().replace(/\.(astro|json)$/, '') || 'home';

  const isJsonFile = pathIdentifier.endsWith('.json');
  const isTestFile = pathIdentifier.startsWith('src/pages/json-preview/') && pathIdentifier.endsWith('.astro');
  const isDraftFile = pathIdentifier.split('/').pop().startsWith('_') && pathIdentifier.endsWith('.astro');
  const editorMode = isTestFile || isJsonFile || isDraftFile ? 'json' : 'astro';

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

      // Use editorMode to determine payload structure, not the 'sections' state
      if (editorMode === 'json') {
        payload.sections = dataToSave;
      } else {
        payload.content = dataToSave;
      }

      localStorage.setItem(key, JSON.stringify(payload));
      setSaveStatus('saved');
    } catch (error) {
      console.error('[ContentEditor] Failed to autosave draft:', error);
      setSaveStatus('unsaved');
    }
  }, [pageId, editorMode]);

  const { triggerSave } = useAutosave(autosaveCallback, 1500);

  const pollBuildStatus = useCallback(async (startTime = Date.now()) => {
    const POLLING_INTERVAL = 5000; // 5 seconds (increased from 3s for more reliable polling)
    const TIMEOUT = 120000; // 2 minutes

    if (Date.now() - startTime > TIMEOUT) {
      console.error('[Build] Polling timed out after 2 minutes.');
      setIsPreviewBuilding(false);
      setBuildError('The live preview build took too long.  Please try refreshing the preview manually.');
      return;
    }

    try {
      const data = await fetchJson('/api/check-build-status');
      console.log(`[Build Poll] Status: ${data.status}, Stage: ${data.stage}`);
      setBuildStage(data.stage || 'Initializing... '); // Update the build stage state

      if (data.status === 'success') {
        console.log('[Build] Build successful!  Waiting 2s before refreshing preview.');
        setBuildStage('Finalizing.. .');

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
        setBuildError(`The live preview build failed with status: ${data.status}. `);
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
    setBuildStage('Queued... '); // Set initial stage
    setBuildError(null); // Clear previous errors

    try {
      const buildPayload = { repo: repo.full_name };
      await fetchJson('/api/trigger-build', {
        method: 'POST',
        body: JSON.stringify(buildPayload),
      });
      console.log('[Build] Build trigger API call successful.  Starting to poll for status.');
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
      if (config.includeBody) newSection.props.body = '<p>New body paragraph. </p>';
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

    const newSections = [... (sections || []), newSection];
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
        const url = `/api/get-file-content? repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(imagePath)}`;
        const { sha } = await fetchJson(url);
        return sha;
      } catch (error) {
        console.error('Failed to get SHA for image:', imagePath, error);
        return null;
      }
    };

    // Helper function to rename an image
    const renameImage = async (originalPath, newPath) => {
      if (!originalPath || ! newPath || originalPath === newPath) {
        return newPath;
      }
      
      console.log('[ContentEditorPage] Renaming image:', { originalPath, newPath });
      
      // Get the SHA for the original file
      const sha = await getImageSha(originalPath);
      if (! sha) {
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
    console.log(`[CEP-handleSync] Sync process initiated. `);
    if (! selectedRepo) {
      console.error('[CEP-handleSync] Aborting: repository not selected.');
      setSyncStatus('error');
      return false; // Indicate sync failure
    }

    // Prevent multiple sync operations at once
    if (syncStatus === 'syncing' || isPreviewBuilding) {
      console.log('[CEP-handleSync] Sync already in progress, ignoring duplicate request.');
      return false; // Indicate sync was not attempted
    }

    setSyncStatus('syncing');
    
    // CRITICAL FIX: Use the current sections state directly instead of reading from localStorage. 
    // The autosave is debounced with a 1500ms delay, so localStorage may contain stale data
    // if the user clicks Sync immediately after making changes.
    // By using the current state, we ensure we're always syncing the latest data.
    console.log('[CEP-handleSync] Status set to "syncing".  Using current sections state.. .');
    try {
      // Check that we have sections to sync (allow empty array for clearing content)
      if (editorMode !== 'json' || !sections) {
        throw new Error('Sync is currently only supported for JSON-mode pages with sections.');
      }

      // Get existing draft metadata from localStorage (for slug, meta, path)
      const draftKey = `easy-seo-draft:${pageId}`;
      const savedDraft = localStorage.getItem(draftKey);
      const draftMeta = savedDraft ? JSON.parse(savedDraft) : {};

      // Force save the current sections to localStorage before syncing
      // This ensures localStorage is up-to-date for future operations
      const updatedDraft = {
        ...draftMeta,
        slug: pageId,
        sections: sections,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(updatedDraft));
      console.log('[CEP-handleSync] Saved current sections to localStorage before sync.');

      const savePayload = {
        repo: selectedRepo.full_name,
        pageData: {
          slug: pageId,
          meta: draftMeta.meta || { title: pageId },
          sections: sections, // Use current state, not localStorage
        },
      };

      // Log sanitized payload info (exclude actual content for security)
      console.log('[CEP-handleSync] Payload prepared.  Calling API endpoint. ', {
        repo: savePayload.repo,
        slug: savePayload.pageData.slug,
        sectionCount: savePayload.pageData.sections?.length || 0,
      });
      await fetchJson('/api/page-json/update', { method: 'POST', body: JSON.stringify(savePayload) });
      console.log('[CEP-handleSync] API call successful. Content saved.');

      // Store the synced content to compare later (use the updated draft we saved)
      lastSyncedContentRef.current = JSON.stringify(updatedDraft);

      setIsPreviewBuilding(true);
      // Don't auto-switch to preview mode - let user decide when to view preview
      // setViewMode('preview'); // Removed: Clicking Sync should not force preview mode

      console.log('[CEP-handleSync] Triggering site build...');
      triggerBuild();
      console.log('[CEP-handleSync] Build triggered.');

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), STATUS_DISPLAY_DURATION);
      return true; // Indicate sync success
    } catch (error) {
      console.error('[CEP-handleSync] Sync process failed. ', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), STATUS_DISPLAY_DURATION);
      return false; // Indicate sync failure
    }
  }, [selectedRepo, pageId, editorMode, triggerBuild, syncStatus, isPreviewBuilding, sections]);

  const handlePreview = useCallback(async () => {
    // Phase 3: New Preview Logic
    // Toggles between editor and preview. When switching to preview, it generates
    // and stores the HTML for the dynamic preview route.

    if (viewMode !== 'editor') {
      setViewMode('editor');
      return;
    }

    try {
      setIsPreviewBuilding(true); // Use existing state for loading indicator
      setBuildError(null);

      if (!sections) throw new Error('Editor content not ready.');

      // Per Phase 1, lexicalToHtml utility should exist. We assume it can process the sections structure.
      const html = lexicalToHtml(sections);

      const slug = pageId || 'temp-preview';
      const title = sections.find(s => s.type === 'hero')?.props?.title || 'Preview';

      const response = await fetchJson('/api/store-preview', {
        method: 'POST',
        body: JSON.stringify({ slug, html, title, layout: 'MainLayout' })
      });

      if (!response || !response.previewUrl) {
          throw new Error('API response missing previewUrl.');
      }

      setDynamicPreviewUrl(`${response.previewUrl}?t=${Date.now()}`);
      setIsPreviewBuilding(false);
      setViewMode('livePreview'); // Switch view to show iframe

    } catch (error) {
      console.error('[ContentEditor] Preview generation failed:', error);
      setBuildError(`Preview failed: ${error.message}`);
      setIsPreviewBuilding(false); // Ensure loading state is turned off on error
    }
  }, [viewMode, sections, pageId]);

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
          console.log('[CEP-useEffect] Local draft found. Attempting to parse and validate.');
          try {
            const draft = JSON.parse(savedDraft);
            // A draft is valid if it has a `sections` array (even an empty one).
            if (Array.isArray(draft.sections)) {
              console.log('[CEP-useEffect] Draft is valid. Loading sections from local draft.');
              setSections(draft.sections);
              // If the draft is valid, we stop here. We don't fetch from the repo.
              return;
            } else {
              console.warn('[CEP-useEffect] Local draft found but is invalid (missing sections array). It will be ignored and removed.');
              localStorage.removeItem(draftKey);
            }
          } catch (e) {
            console.error('[CEP-useEffect] Failed to parse local draft. Removing corrupted item.', { error: e });
            localStorage.removeItem(draftKey);
          }
        }

        // --- Fallback Logic ---
        // This code now runs if:
        // 1. No local draft was found.
        // 2. A local draft was found but was empty, invalid, or corrupted.
        console.log('[CEP-useEffect] No valid local draft. Fetching from repository using full path...');
        const repo = selectedRepo?.full_name || 'Jacques-on-Call/StrategyContent';
        try {
          // JULES' FIX - STEP 2.4: Use the correct, path-based API endpoint, not the slug-based one.
          // This ensures we are fetching the exact file clicked in the explorer.
          const url = `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(pathIdentifier)}`;
          console.log('[CEP-useEffect] Fetching from URL:', url);
          const fileData = await fetchJson(url);
          console.log('[CEP-useEffect] Successfully fetched file data.');

          // The get-file-content endpoint returns base64 content, so we must decode it.
          const binaryString = atob(fileData.content || '');
          const decodedContent = decodeURIComponent(escape(binaryString));
          const pageJson = JSON.parse(decodedContent);

          const fetchedSections = pageJson.sections || getDefaultSections();
          setSections(fetchedSections);

          // Save fetched content as the initial draft
          const draftPayload = {
            slug: pageId,
            meta: pageJson.meta || { title: pageId },
            sections: fetchedSections,
            path: pathIdentifier, // Use the correct pathIdentifier
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
          const url = `/api/get-file-content? repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`;
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
          setContentBody('// Error loading content.  Please try again.');
        }
      };

      if (editorMode === 'json') {
        loadJsonModeContent();
      } else {
        loadAstroModeContent();
      }

    } catch (e) {
      console.error('[CEP-useEffect] CRITICAL: The main useEffect hook crashed. ', { error: e });
    }
    // Dependencies: Only use primitive values to prevent re-runs when callbacks are recreated
    // getDefaultSections is stable (empty deps), but we inline calls anyway for safety
    // selectedRepo?.full_name extracts the primitive string value from the object
  }, [pageId, selectedRepo?.full_name, editorMode]);

  // NOTE: The Visual Viewport useEffect was REMOVED. 
  // It was manipulating the header's top style which conflicted with CSS-based fixed positioning.
  // The CSS in EditorHeader.css now handles all positioning, including keyboard scenarios. 

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

      // The Rule: Keep the underscore. Only strip the file extension (.astro)
      // and the word index if it appears at the very end of a path.
      if (result.endsWith('/index') || result === 'index') {
          result = result.substring(0, result.lastIndexOf('index'));
      }
      if (result.endsWith('/_index')) {
        result = result.substring(0, result.lastIndexOf('_index'));
      }

      return result;
    };

    const previewPath = generatePreviewPath(pathIdentifier);
    // Add the previewKey as a cache-busting query parameter
    const finalUrl = `https://strategycontent.pages.dev/${previewPath}? _t=${previewKey}`;
    return finalUrl;
  }, [pathIdentifier, previewKey]);

  // Render the appropriate view based on viewMode
  const renderContent = ({ onEditorReady }) => {
    if (viewMode === 'editor') {
      return (
        <>
          {sections ? (
            <SectionsEditor sections={sections} onChange={handleSectionsChange} onEdit={handleEditSection} onReady={onEditorReady} />
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
        </>
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
              <p class="text-sm">Your changes are being deployed.  This may take a minute.</p>
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
          src={dynamicPreviewUrl || previewUrl}
          title="Live Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  };

  const editorContextValue = useMemo(() => ({
    // This is a placeholder. The actual editor instance will be set by a child component.
    activeEditor: null,
    setActiveEditor: () => {}, // Placeholder function
    // Pass down the state needed by the toolbar
    sections: sections,
    // Pass down the handlers
    onAddSection: handleAddSection,
    onEditSection: handleEditSection,
    onUpdateSection: handleUpdateSection,
  }), [sections, handleAddSection, handleEditSection, handleUpdateSection]);

  return (
    <EditorProvider value={editorContextValue}>
      <EditorCanvas
        viewMode={viewMode}
        pageId={pageId}
        renderContent={renderContent}
        saveStatus={saveStatus}
        syncStatus={syncStatus}
        isPreviewBuilding={isPreviewBuilding}
        pageScoreData={pageScoreData}
        editorMode={editorMode}
        openAddSectionModal={openAddSectionModal}
        handlePreview={handlePreview}
        handleSync={handleSync}
        handleRefreshPreview={handleRefreshPreview}
        sections={sections}
        handleAddSection={handleAddSection}
        editingSectionIndex={editingSectionIndex}
        handleUpdateSection={handleUpdateSection}
      />
    </EditorProvider>
  );
}
