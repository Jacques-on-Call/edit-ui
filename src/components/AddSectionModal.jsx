import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { useUI } from '../contexts/UIContext';
import { X, ArrowLeft } from 'lucide-preact';

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

const HeroConfigurator = ({ config, setConfig }) => {
  return (
    <div class="space-y-4">
      <CheckboxInput label="Include Slogan" checked={config.includeSlogan} onChange={e => setConfig({ ...config, includeSlogan: e.target.checked })} />
      <CheckboxInput label="Include Body Paragraph" checked={config.includeBody} onChange={e => setConfig({ ...config, includeBody: e.target.checked })} />
      <div>
        <CheckboxInput label="Add Feature Image" checked={config.includeFeatureImage} onChange={e => setConfig({ ...config, includeFeatureImage: e.target.checked })} />
        {config.includeFeatureImage && <UrlInput placeholder="https://example.com/feature.jpg" value={config.featureImageUrl} onInput={e => setConfig({...config, featureImageUrl: e.target.value})} />}
      </div>
      <div>
        <CheckboxInput label="Add Background Image" checked={config.includeBackgroundImage} onChange={e => setConfig({ ...config, includeBackgroundImage: e.target.checked })} />
        {config.includeBackgroundImage && <UrlInput placeholder="https://example.com/background.jpg" value={config.backgroundImageUrl} onInput={e => setConfig({...config, backgroundImageUrl: e.target.value})} />}
      </div>
    </div>
  );
};

const TextSectionConfigurator = ({ config, setConfig }) => {
  return (
    <div class="space-y-4">
      <CheckboxInput label="Include Title" checked={config.includeTitle} onChange={e => setConfig({ ...config, includeTitle: e.target.checked })} />
    </div>
  );
};

const DEFAULT_CONFIGS = {
  hero: { includeSlogan: true, includeBody: true, includeFeatureImage: false, featureImageUrl: '', includeBackgroundImage: false, backgroundImageUrl: '' },
  textSection: { includeTitle: true },
};

export default function AddSectionModal({ onAddSection }) {
  const { isAddSectionModalOpen, closeAddSectionModal } = useUI();
  const [step, setStep] = useState('select'); // 'select' or 'configure'
  const [selectedSection, setSelectedSection] = useState(null);
  const [config, setConfig] = useState({});

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

  const handleCreateSection = () => {
    if (onAddSection && selectedSection) {
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
      {selectedSection === 'hero' && <HeroConfigurator config={config} setConfig={setConfig} />}
      {selectedSection === 'textSection' && <TextSectionConfigurator config={config} setConfig={setConfig} />}
      <div class="mt-6 flex justify-end">
        <button onClick={handleCreateSection} class="bg-yellow-green text-black font-bold px-6 py-2 rounded-lg hover:bg-lime-400 transition-colors">Add Section to Page</button>
      </div>
    </div>
  );

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in-fast">
      <div class="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-lg shadow-xl w-full max-w-md m-4">
        <header class="flex items-center justify-between p-4 border-b border-gray-800">
          {step === 'configure' && (
            <button onClick={handleBack} class="text-gray-400 hover:text-white transition-colors mr-2" aria-label="Go back">
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 class="text-xl font-bold text-white flex-grow">
            {step === 'select' ? 'Add a New Section' : `Configure ${selectedSection === 'hero' ? 'Hero' : 'Text'} Section`}
          </h2>
          <button onClick={handleClose} class="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <X size={24} />
          </button>
        </header>
        <div class="p-6">
          {step === 'select' ? renderSelectStep() : renderConfigureStep()}
        </div>
      </div>
    </div>
  );
}
