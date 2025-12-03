import { h } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';
import { useUI } from '../contexts/UIContext';
import { X, ArrowLeft } from 'lucide-preact';
import ImageUploader from './ImageUploader';
import ImageEditor from './ImageEditor';
import { extractTopicWords } from '../lib/imageScoring';

const SectionThumbnail = ({ title, description, onClick, children }) => (
  <button
    onClick={onClick}
    class="flex items-center w-full p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-lime"
  >
    <div class="flex-shrink-0 w-20 h-20 bg-gray-900 rounded-md flex items-center justify-center mr-4">
      {children}
    </div>
    <div>
      <h3 class="text-lg font-bold text-white">{title}</h3>
      <p class="text-sm text-gray-400">{description}</p>
    </div>
  </button>
);

const CheckboxInput = ({ label, checked, onChange }) => (
  <label class="flex items-center space-x-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      class="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-accent-lime focus:ring-accent-lime"
    />
    <span class="text-white">{label}</span>
  </label>
);

const UrlInput = ({ placeholder, value, onInput }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onInput={onInput}
    class="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
  />
);

const HeroConfigurator = ({ config, setConfig, pageSlug, isEditing = false, topicWords = [] }) => {
  const [featureUploadMode, setFeatureUploadMode] = useState('url');
  const [bgUploadMode, setBgUploadMode] = useState('url');
  
  // Check if we have existing images (for edit mode)
  // Check both featureImage and featureImageUrl for backwards compatibility
  const featureImagePath = config.featureImage || config.featureImageUrl;
  const hasExistingFeatureImage = isEditing && featureImagePath && featureImagePath.startsWith('src/');
  const hasExistingBackgroundImage = isEditing && config.backgroundImageUrl && config.backgroundImageUrl.startsWith('src/');

  const handleFeatureImageComplete = ({ path, alt, title, description, loading }) => {
    console.log('[HeroConfigurator] handleFeatureImageComplete triggered', { path, alt, title, description, loading });
    // Set both featureImage and featureImageUrl for compatibility with HeroEditor
    setConfig({
      ...config,
      featureImage: path,
      featureImageUrl: path,
      featureImageAlt: alt,
      featureImageTitle: title,
      featureImageDescription: description,
      featureImageLoading: loading
    });
  };

  const handleBackgroundImageComplete = ({ path, alt, title, description, loading }) => {
    console.log('[HeroConfigurator] handleBackgroundImageComplete triggered', { path, alt, title, description, loading });
    setConfig({
      ...config,
      backgroundImageUrl: path,
      backgroundImageAlt: alt,
      backgroundImageTitle: title,
      backgroundImageDescription: description,
      backgroundImageLoading: loading
    });
  };
  
  // Handler for ImageEditor updates (for existing images)
  const handleFeatureImageUpdate = ({ path, alt, title, description, loading, originalPath }) => {
    console.log('[HeroConfigurator] handleFeatureImageUpdate', { path, alt, title, description, loading, originalPath });
    setConfig({
      ...config,
      featureImage: path,
      featureImageUrl: path,
      featureImageAlt: alt,
      featureImageTitle: title,
      featureImageDescription: description,
      featureImageLoading: loading,
      // Track original path for rename operation
      _originalFeatureImagePath: originalPath !== path ? originalPath : undefined
    });
  };
  
  const handleBackgroundImageUpdate = ({ path, alt, title, description, loading, originalPath }) => {
    console.log('[HeroConfigurator] handleBackgroundImageUpdate', { path, alt, title, description, loading, originalPath });
    setConfig({
      ...config,
      backgroundImageUrl: path,
      backgroundImageAlt: alt,
      backgroundImageTitle: title,
      backgroundImageDescription: description,
      backgroundImageLoading: loading,
      // Track original path for rename operation
      _originalBackgroundImagePath: originalPath !== path ? originalPath : undefined
    });
  };
  
  const handleRemoveFeatureImage = () => {
    setConfig({
      ...config,
      includeFeatureImage: false,
      featureImage: undefined,
      featureImageUrl: undefined,
      featureImageAlt: undefined,
      featureImageTitle: undefined,
      featureImageDescription: undefined,
      featureImageLoading: undefined
    });
  };
  
  const handleRemoveBackgroundImage = () => {
    setConfig({
      ...config,
      includeBackgroundImage: false,
      backgroundImageUrl: undefined,
      backgroundImageAlt: undefined,
      backgroundImageTitle: undefined,
      backgroundImageDescription: undefined,
      backgroundImageLoading: undefined
    });
  };

  return (
    <div class="space-y-4">
      <CheckboxInput label="Include Slogan" checked={config.includeSlogan} onChange={e => setConfig({ ...config, includeSlogan: e.target.checked })} />
      <CheckboxInput label="Include Body Paragraph" checked={config.includeBody} onChange={e => setConfig({ ...config, includeBody: e.target.checked })} />
      <div>
        <CheckboxInput label="Add Feature Image" checked={config.includeFeatureImage} onChange={e => setConfig({ ...config, includeFeatureImage: e.target.checked })} />
        {config.includeFeatureImage && (
          <div class="mt-2 pl-6 space-y-3">
            {/* Show ImageEditor for existing images, otherwise show upload options */}
            {hasExistingFeatureImage ? (
              <ImageEditor
                imagePath={featureImagePath}
                imageAlt={config.featureImageAlt || ''}
                imageTitle={config.featureImageTitle || ''}
                imageDescription={config.featureImageDescription || ''}
                imageLoading={config.featureImageLoading || 'lazy'}
                pageSlug={pageSlug}
                topicWords={topicWords}
                onUpdate={handleFeatureImageUpdate}
                onRemove={handleRemoveFeatureImage}
                label="Feature Image"
              />
            ) : (
              <>
                <div class="flex items-center space-x-4">
                  <label class="flex items-center space-x-2">
                    <input type="radio" name="featureImageSource" value="url" checked={featureUploadMode === 'url'} onChange={() => setFeatureUploadMode('url')} class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime" />
                    <span class="text-white">From URL</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="radio" name="featureImageSource" value="upload" checked={featureUploadMode === 'upload'} onChange={() => setFeatureUploadMode('upload')} class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime" />
                    <span class="text-white">Upload</span>
                  </label>
                </div>
                {featureUploadMode === 'url' ? (
                  <div>
                    <UrlInput placeholder="topic-keyword-image-description.jpg (e.g., estate-planning-attorney-austin.jpg)" value={config.featureImageUrl} onInput={e => setConfig({ ...config, featureImageUrl: e.target.value })} />
                    <input type="text" placeholder="Describe image with topic words (e.g., Estate planning attorney meeting with client in Austin office)" value={config.featureImageAlt} onInput={e => setConfig({ ...config, featureImageAlt: e.target.value })} class="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime" />
                  </div>
                ) : (
                  <ImageUploader pageSlug={pageSlug} onComplete={handleFeatureImageComplete} />
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div>
        <CheckboxInput label="Add Background Image" checked={config.includeBackgroundImage} onChange={e => setConfig({ ...config, includeBackgroundImage: e.target.checked })} />
        {config.includeBackgroundImage && (
          <div class="mt-2 pl-6 space-y-3">
            {/* Show ImageEditor for existing images, otherwise show upload options */}
            {hasExistingBackgroundImage ? (
              <ImageEditor
                imagePath={config.backgroundImageUrl}
                imageAlt={config.backgroundImageAlt || ''}
                imageTitle={config.backgroundImageTitle || ''}
                imageDescription={config.backgroundImageDescription || ''}
                imageLoading={config.backgroundImageLoading || 'lazy'}
                pageSlug={pageSlug}
                topicWords={topicWords}
                onUpdate={handleBackgroundImageUpdate}
                onRemove={handleRemoveBackgroundImage}
                label="Background Image"
              />
            ) : (
              <>
                <div class="flex items-center space-x-4">
                  <label class="flex items-center space-x-2">
                    <input type="radio" name="bgImageSource" value="url" checked={bgUploadMode === 'url'} onChange={() => setBgUploadMode('url')} class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime" />
                    <span class="text-white">From URL</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="radio" name="bgImageSource" value="upload" checked={bgUploadMode === 'upload'} onChange={() => setBgUploadMode('upload')} class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime" />
                    <span class="text-white">Upload</span>
                  </label>
                </div>
                {bgUploadMode === 'url' ? (
                  <div>
                    <UrlInput placeholder="topic-keyword-background.jpg (e.g., modern-law-office-interior.jpg)" value={config.backgroundImageUrl} onInput={e => setConfig({ ...config, backgroundImageUrl: e.target.value })} />
                    <input type="text" placeholder="Describe image with topic words (e.g., Modern law office interior with legal books)" value={config.backgroundImageAlt} onInput={e => setConfig({ ...config, backgroundImageAlt: e.target.value })} class="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime" />
                  </div>
                ) : (
                  <ImageUploader pageSlug={pageSlug} onComplete={handleBackgroundImageComplete} />
                )}
              </>
            )}
          </div>
        )}
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
        <div class="flex items-center space-x-4 pl-6">
          <label class="flex items-center space-x-2">
            <input
              type="radio"
              name="textColor"
              value="white"
              checked={!config.textColor || config.textColor === 'white'}
              onChange={() => setConfig({ ...config, textColor: 'white' })}
              class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
            />
            <span class="text-white">White</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              type="radio"
              name="textColor"
              value="black"
              checked={config.textColor === 'black'}
              onChange={() => setConfig({ ...config, textColor: 'black' })}
              class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
            />
            <span class="text-white">Black</span>
          </label>
        </div>
      </div>
    </div>
  );
};

const TextSectionConfigurator = ({ config, setConfig, pageSlug, isEditing = false, topicWords = [] }) => {
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'upload'
  
  // Check if we have an existing image (for edit mode)
  // Check both featureImage and headerImageUrl for backwards compatibility with BodySectionEditor
  const headerImagePath = config.featureImage || config.headerImageUrl;
  const hasExistingHeaderImage = isEditing && headerImagePath && headerImagePath.startsWith('src/');

  const handleImageComplete = ({ path, alt, title, description, loading }) => {
    console.log('[TextSectionConfigurator] handleImageComplete triggered', { path, alt, title, description, loading });
    const newConfig = {
      ...config,
      headerImageUrl: path,
      headerImageAlt: alt,
      headerImageTitle: title,
      headerImageDescription: description,
      headerImageLoading: loading
    };
    setConfig(newConfig);
  };
  
  // Handler for ImageEditor updates (for existing images)
  const handleHeaderImageUpdate = ({ path, alt, title, description, loading, originalPath }) => {
    console.log('[TextSectionConfigurator] handleHeaderImageUpdate', { path, alt, title, description, loading, originalPath });
    setConfig({
      ...config,
      headerImageUrl: path,
      headerImageAlt: alt,
      headerImageTitle: title,
      headerImageDescription: description,
      headerImageLoading: loading,
      // Track original path for rename operation
      _originalHeaderImagePath: originalPath !== path ? originalPath : undefined
    });
  };
  
  const handleRemoveHeaderImage = () => {
    setConfig({
      ...config,
      includeHeaderImage: false,
      headerImageUrl: undefined,
      headerImageAlt: undefined,
      headerImageTitle: undefined,
      headerImageDescription: undefined,
      headerImageLoading: undefined
    });
  };

  return (
    <div class="space-y-4">
      <CheckboxInput label="Include Title" checked={config.includeTitle} onChange={e => setConfig({ ...config, includeTitle: e.target.checked })} />
      <div>
        <CheckboxInput label="Add Header Image" checked={config.includeHeaderImage} onChange={e => setConfig({ ...config, includeHeaderImage: e.target.checked })} />
        {config.includeHeaderImage && (
          <div class="mt-2 pl-6 space-y-3">
            {/* Show ImageEditor for existing images, otherwise show upload options */}
            {hasExistingHeaderImage ? (
              <ImageEditor
                imagePath={headerImagePath}
                imageAlt={config.headerImageAlt || ''}
                imageTitle={config.headerImageTitle || ''}
                imageDescription={config.headerImageDescription || ''}
                imageLoading={config.headerImageLoading || 'lazy'}
                pageSlug={pageSlug}
                topicWords={topicWords}
                onUpdate={handleHeaderImageUpdate}
                onRemove={handleRemoveHeaderImage}
                label="Header Image"
              />
            ) : (
              <>
                <div class="flex items-center space-x-4">
                  <label class="flex items-center space-x-2">
                    <input type="radio" name="imageSource" value="url" checked={uploadMode === 'url'} onChange={() => setUploadMode('url')} class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime" />
                    <span class="text-white">From URL</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="radio" name="imageSource" value="upload" checked={uploadMode === 'upload'} onChange={() => setUploadMode('upload')} class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime" />
                    <span class="text-white">Upload</span>
                  </label>
                </div>
                {uploadMode === 'url' ? (
                  <div>
                    <UrlInput placeholder="topic-keyword-section-image.jpg (e.g., legal-consultation-process.jpg)" value={config.headerImageUrl} onInput={e => setConfig({ ...config, headerImageUrl: e.target.value })} />
                    <input type="text" placeholder="Describe image with topic words (e.g., Legal consultation process with experienced attorney)" value={config.headerImageAlt} onInput={e => setConfig({ ...config, headerImageAlt: e.target.value })} class="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime" />
                  </div>
                ) : (
                  <ImageUploader pageSlug={pageSlug} onComplete={handleImageComplete} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DEFAULT_CONFIGS = {
  hero: { includeSlogan: true, includeBody: true, includeFeatureImage: false, featureImageUrl: '', includeBackgroundImage: false, backgroundImageUrl: '', textColor: 'white' },
  textSection: { includeTitle: true, includeHeaderImage: false, headerImageUrl: '', headerImageAlt: '' },
};

export default function AddSectionModal({ pageSlug, pageData, onAddSection, sectionToEdit, onUpdateSection }) {
  const { isAddSectionModalOpen, closeAddSectionModal } = useUI();
  const [step, setStep] = useState('select'); // 'select' or 'configure'
  const [selectedSection, setSelectedSection] = useState(null);
  const [config, setConfig] = useState({});
  
  // Extract topic words from page data for ID Score calculation
  const topicWords = pageData ? extractTopicWords(pageData) : [];

  // Effect to populate the modal when it's opened for editing
  useEffect(() => {
    if (sectionToEdit && isAddSectionModalOpen) {
      setSelectedSection(sectionToEdit.type);

      const defaultConfig = DEFAULT_CONFIGS[sectionToEdit.type] || {};
      const initialConfig = { ...defaultConfig, ...sectionToEdit.props };

      // Re-construct "include" flags based on the presence of data.
      // This ensures the checkboxes in the UI accurately reflect the section's state.
      // Check for both featureImage and featureImageUrl for backwards compatibility,
      // as some sections may have used one or the other.
      if (sectionToEdit.type === 'hero') {
        initialConfig.includeSlogan = !!initialConfig.subtitle;
        initialConfig.includeBody = !!initialConfig.body;
        // Check both featureImage and featureImageUrl for feature image presence
        const hasFeatureImage = !!(initialConfig.featureImage || initialConfig.featureImageUrl);
        initialConfig.includeFeatureImage = hasFeatureImage;
        // Normalize: ensure featureImageUrl is set if featureImage exists
        if (initialConfig.featureImage && !initialConfig.featureImageUrl) {
          initialConfig.featureImageUrl = initialConfig.featureImage;
        }
        initialConfig.includeBackgroundImage = !!initialConfig.backgroundImageUrl;
      } else if (sectionToEdit.type === 'textSection') {
        initialConfig.includeTitle = !!initialConfig.title;
        // Check both featureImage and headerImageUrl for header image presence
        const hasHeaderImage = !!(initialConfig.featureImage || initialConfig.headerImageUrl);
        initialConfig.includeHeaderImage = hasHeaderImage;
        // Normalize: ensure headerImageUrl is set if featureImage exists
        if (initialConfig.featureImage && !initialConfig.headerImageUrl) {
          initialConfig.headerImageUrl = initialConfig.featureImage;
        }
      }

      setConfig(initialConfig);
      setStep('configure');
    }
  }, [sectionToEdit, isAddSectionModalOpen]);

  const handleClose = () => {
    // Reset state on close for next time
    setStep('select');
    setSelectedSection(null);
    setConfig({});
    closeAddSectionModal();
  }

  if (!isAddSectionModalOpen) {
    return null;
  }

  const handleSelectSection = (sectionType) => {
    setSelectedSection(sectionType);
    setConfig(DEFAULT_CONFIGS[sectionType]);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedSection(null);
    setConfig({});
  };

  const constructUpdatedProps = (originalProps, config) => {
    const newProps = { ...originalProps };

    // Carefully merge only the properties managed by the modal
    
    // For Hero sections: featureImage and featureImageUrl properties
    // Set both featureImage and featureImageUrl for compatibility with HeroEditor which uses either
    const featureImagePath = config.includeFeatureImage ? config.featureImageUrl : undefined;
    newProps.featureImage = featureImagePath;
    newProps.featureImageUrl = featureImagePath;
    newProps.featureImageAlt = config.includeFeatureImage ? config.featureImageAlt : undefined;
    newProps.featureImageTitle = config.includeFeatureImage ? config.featureImageTitle : undefined;
    newProps.featureImageDescription = config.includeFeatureImage ? config.featureImageDescription : undefined;
    newProps.featureImageLoading = config.includeFeatureImage ? config.featureImageLoading : undefined;
    
    // Background image properties (Hero sections only)
    newProps.backgroundImageUrl = config.includeBackgroundImage ? config.backgroundImageUrl : undefined;
    newProps.backgroundImageAlt = config.includeBackgroundImage ? config.backgroundImageAlt : undefined;
    newProps.backgroundImageTitle = config.includeBackgroundImage ? config.backgroundImageTitle : undefined;
    newProps.backgroundImageDescription = config.includeBackgroundImage ? config.backgroundImageDescription : undefined;
    newProps.backgroundImageLoading = config.includeBackgroundImage ? config.backgroundImageLoading : undefined;
    
    // For Text sections: headerImage properties
    // Set headerImageUrl and also featureImage for backward compatibility with BodySectionEditor
    // (which uses: props?.featureImage || props?.headerImageUrl)
    // 
    // Important: This sets featureImage for text sections. For hero sections, this will set
    // featureImage to undefined (since includeHeaderImage is false), but that's intentional
    // because the featureImage for hero sections was already set above from includeFeatureImage.
    // The cleanup step below will remove undefined properties.
    const headerImagePath = config.includeHeaderImage ? config.headerImageUrl : undefined;
    // For text sections with header image, also set featureImage for BodySectionEditor compatibility
    if (headerImagePath) {
      newProps.featureImage = headerImagePath;
    }
    newProps.headerImageUrl = headerImagePath;
    newProps.headerImageAlt = config.includeHeaderImage ? config.headerImageAlt : undefined;
    newProps.headerImageTitle = config.includeHeaderImage ? config.headerImageTitle : undefined;
    newProps.headerImageDescription = config.includeHeaderImage ? config.headerImageDescription : undefined;
    newProps.headerImageLoading = config.includeHeaderImage ? config.headerImageLoading : undefined;
    
    // Text color
    newProps.textColor = config.textColor;

    if (!config.includeSlogan) newProps.subtitle = undefined;
    if (!config.includeBody) newProps.body = undefined;
    if (!config.includeTitle) newProps.title = undefined;
    
    // Track original paths for rename operations (these are internal and will be handled by ContentEditorPage)
    if (config._originalFeatureImagePath) {
      newProps._originalFeatureImagePath = config._originalFeatureImagePath;
    }
    if (config._originalBackgroundImagePath) {
      newProps._originalBackgroundImagePath = config._originalBackgroundImagePath;
    }
    if (config._originalHeaderImagePath) {
      newProps._originalHeaderImagePath = config._originalHeaderImagePath;
    }

    // Clean up undefined properties to keep the data clean
    Object.keys(newProps).forEach(key => {
      if (newProps[key] === undefined) {
        delete newProps[key];
      }
    });

    return newProps;
  };

  const handleCreateSection = () => {
    if (sectionToEdit && onUpdateSection) {
      const updatedProps = constructUpdatedProps(sectionToEdit.props, config);
      onUpdateSection({ ...sectionToEdit, props: updatedProps });
    } else if (onAddSection && selectedSection) {
      onAddSection(selectedSection, config);
    }
    handleClose(); // Close and reset modal after adding
  };

  const renderSelectStep = () => (
    <div class="space-y-4">
      <SectionThumbnail title="Hero Section" description="A prominent section for the top of your page." onClick={() => handleSelectSection('hero')}>
        <div class="text-center"><p class="text-2xl font-bold text-white">H1</p><p class="text-xs text-gray-400 mt-1">Slogan</p><p class="text-xs text-gray-500 mt-1">Body...</p></div>
      </SectionThumbnail>
      <SectionThumbnail title="Text Section" description="A versatile section for headings and paragraphs." onClick={() => handleSelectSection('textSection')}>
        <div class="text-center"><p class="text-xl font-bold text-white">H2</p><p class="text-xs text-gray-500 mt-1">Body...</p></div>
      </SectionThumbnail>
    </div>
  );

  const renderConfigureStep = () => (
    <div>
      {selectedSection === 'hero' && <HeroConfigurator config={config} setConfig={setConfig} pageSlug={pageSlug} isEditing={!!sectionToEdit} topicWords={topicWords} />}
      {selectedSection === 'textSection' && <TextSectionConfigurator config={config} setConfig={setConfig} pageSlug={pageSlug} isEditing={!!sectionToEdit} topicWords={topicWords} />}
      <div class="mt-6 flex justify-end">
        <button onClick={handleCreateSection} class="bg-yellow-green text-black font-bold px-6 py-2 rounded-lg hover:bg-lime-400 transition-colors">
          {sectionToEdit ? 'Save Changes' : 'Add Section to Page'}
        </button>
      </div>
    </div>
  );

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in-fast overflow-y-auto py-4">
      <div class="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4 my-auto max-h-[90vh] flex flex-col">
        <header class="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          {step === 'configure' && (
            <button onClick={handleBack} class="text-gray-400 hover:text-white transition-colors mr-2" aria-label="Go back">
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 class="text-xl font-bold text-white flex-grow">
            {step === 'select' ? 'Add a New Section' : `${sectionToEdit ? 'Edit' : 'Configure'} ${selectedSection === 'hero' ? 'Hero' : 'Text'} Section`}
          </h2>
          <button onClick={handleClose} class="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <X size={24} />
          </button>
        </header>
        <div class="p-6 overflow-y-auto flex-1">
          {step === 'select' ? renderSelectStep() : renderConfigureStep()}
        </div>
      </div>
    </div>
  );
}
