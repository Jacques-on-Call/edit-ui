import { useState, useEffect } from 'react';
import styles from './SearchPreviewModal.module.css';
import { getAiSchemaSuggestions } from './utils/aiSchemaService.js';
import SchemaSandbox from './components/SchemaSandbox';

// A new sub-component for the visual SERP preview, defined at the top level
function SerpPreview({ title, description, slug }) {
  const siteUrl = `https://www.strategycontent.agency/${slug}`;
  return (
    <div className={styles.serpPreview}>
      <span className={styles.serpUrl}>{siteUrl}</span>
      <h3 className={styles.serpTitle}>{title || 'Your Title Here'}</h3>
      <p className={styles.serpDescription}>{description || 'Your meta description will appear here. Try to keep it under 160 characters.'}</p>
    </div>
  );
}

// --- Sub-components for the Rich Results UI ---

function SuggestionCard({ suggestion, isEnabled, onToggle }) {
  // A simple card to display a single AI suggestion.
  // Note: The actual styles would be in the CSS module file.
  return (
    <div className={`${styles.suggestionCard} ${isEnabled ? styles.enabled : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.schemaType}>{suggestion.type}</span>
        <div className={styles.toggleSwitch}>
          <input
            type="checkbox"
            id={`toggle-${suggestion.type}`}
            checked={isEnabled}
            onChange={onToggle}
          />
          <label htmlFor={`toggle-${suggestion.type}`}></label>
        </div>
      </div>
      <p className={styles.reason}>
        <span className={styles.confidence}>({(suggestion.confidence * 100).toFixed(0)}% confidence)</span>
        {suggestion.reason}
      </p>
    </div>
  );
}

function SerpSimulator({ schemas }) {
  // A simplified simulator to give a visual cue of the schema's effect.
  if (!schemas || (Array.isArray(schemas) && schemas.length === 0)) {
    return <p className={styles.simulatorPlaceholder}>Enable a schema to see a preview.</p>;
  }

  const schemaArray = Array.isArray(schemas) ? schemas : [schemas];

  const renderSchemaPreview = (schema) => {
    switch (schema['@type']) {
      case 'FAQPage':
        return (
          <div key={schema['@type']} className={styles.faqSerp}>
            {schema.mainEntity?.map((item, index) => (
              <div key={index} className={styles.faqItem}><strong>{item.name}</strong></div>
            ))}
          </div>
        );
      case 'Event':
        return (
          <div key={schema['@type']} className={styles.eventSerp}>
            <p><strong>Event:</strong> {schema.name}</p>
            <p><strong>Date:</strong> {new Date(schema.startDate).toLocaleDateString()}</p>
          </div>
        );
      case 'Product':
        return (
          <div key={schema['@type']} className={styles.productSerp}>
            <p><strong>Product:</strong> {schema.name} - <strong>{schema.offers?.priceCurrency}{schema.offers?.price}</strong></p>
          </div>
        );
      default:
        return <p key={schema['@type']}>Preview for {schema['@type']}</p>;
    }
  };

  return (
    <div>
      {schemaArray.map(renderSchemaPreview)}
    </div>
  );
}


function SearchPreviewModal({
  initialTitle = '',
  initialDescription = '',
  initialSlug = '',
  initialJsonSchema = {},
  sections = [], // New prop for block-by-block analysis
  pageContent = '', // Now receiving this from FileViewer
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('serp');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [slug, setSlug] = useState(initialSlug);

  // AI-related state
  const [suggestions, setSuggestions] = useState([]);
  const [enabledSuggestions, setEnabledSuggestions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [finalJsonSchema, setFinalJsonSchema] = useState(initialJsonSchema);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualSchemas, setManualSchemas] = useState([]);

  // Fetch AI suggestions when the modal opens
  useEffect(() => {
    if (!pageContent) {
        setIsLoading(false);
        return;
    };

    getAiSchemaSuggestions(pageContent).then(results => {
      setSuggestions(results);
      // Enable all suggestions by default
      const initialEnabledState = results.reduce((acc, suggestion) => {
        acc[suggestion.type] = true;
        return acc;
      }, {});
      setEnabledSuggestions(initialEnabledState);
      setIsLoading(false);
    });
  }, [pageContent]);

  // Update the final JSON schema whenever the enabled suggestions or manual schemas change
  useEffect(() => {
    const aiSchemas = suggestions
      .filter(suggestion => enabledSuggestions[suggestion.type])
      .map(suggestion => suggestion.schema);

    const combined = [...aiSchemas, ...manualSchemas];

    // If multiple schemas are enabled, return an array. If one, return a single object.
    const finalOutput = combined.length === 1 ? combined[0] : combined;
    setFinalJsonSchema(finalOutput);

  }, [suggestions, enabledSuggestions, manualSchemas]);

  const handleToggleSuggestion = (type) => {
    setEnabledSuggestions(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleAnalyzeBlock = async (blockContent) => {
    const newSuggestions = await getAiSchemaSuggestions(blockContent);
    // Merge new suggestions, avoiding duplicates
    setSuggestions(prev => {
        const existingTypes = new Set(prev.map(s => s.type));
        const uniqueNewSuggestions = newSuggestions.filter(s => !existingTypes.has(s.type));
        return [...prev, ...uniqueNewSuggestions];
    });
    // Also enable the new suggestions by default
    setEnabledSuggestions(prev => {
        const newState = {...prev};
        newSuggestions.forEach(s => {
            newState[s.type] = true;
        });
        return newState;
    });
  };

  const handleSave = () => {
    // We pass the combined schema object on save
    onSave({ title, description, slug, jsonSchema: finalJsonSchema });
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Search Preview</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'serp' ? styles.active : ''}`}
            onClick={() => setActiveTab('serp')}
          >
            SERP View
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'rich-results' ? styles.active : ''}`}
            onClick={() => setActiveTab('rich-results')}
          >
            Rich Results
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'serp' && (
            <div className={styles.serpTab}>
              <h4>Live Preview</h4>
              <SerpPreview title={title} description={description} slug={slug} />
              <hr className={styles.divider} />

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label htmlFor="meta-title">Meta Title</label>
                  <span className={styles.charCounter}>{title.length} / 60</span>
                </div>
                <input
                  id="meta-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.inputField}
                  maxLength="60"
                />
              </div>
              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label htmlFor="meta-description">Meta Description</label>
                  <span className={styles.charCounter}>{description.length} / 160</span>
                </div>
                <textarea
                  id="meta-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textareaField}
                  rows="4"
                  maxLength="160"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="url-slug">URL Slug</label>
                <input
                  id="url-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={styles.inputField}
                />
              </div>
            </div>
          )}
          {activeTab === 'rich-results' && (
            <div className={styles.jsonTab}>
              {isLoading ? (
                <div className={styles.loadingState}>
                  <p>🤖 Analyzing content for Rich Results...</p>
                </div>
              ) : (
                <div className={styles.richResultsContainer}>
                  <div className={styles.suggestionsPanel}>
                    <h4>AI Suggestions</h4>
                    {suggestions.length > 0 ? (
                      suggestions.map(suggestion => (
                        <SuggestionCard
                          key={suggestion.type}
                          suggestion={suggestion}
                          isEnabled={!!enabledSuggestions[suggestion.type]}
                          onToggle={() => handleToggleSuggestion(suggestion.type)}
                        />
                      ))
                    ) : (
                      <p>No schema suggestions found for the page.</p>
                    )}
                    <div className={styles.blockAnalyzer}>
                      <h5>Analyze Content Blocks</h5>
                      {sections.filter(s => s.type === 'text_block').map((section, index) => (
                        <div key={index} className={styles.block}>
                          <p className={styles.blockContent}>"{section.content.substring(0, 100)}..."</p>
                          <button onClick={() => handleAnalyzeBlock(section.content)}>Analyze</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.previewPanel}>
                    <div className={styles.jsonPreview}>
                      <h5>Generated JSON-LD</h5>
                      <pre>{JSON.stringify(finalJsonSchema, null, 2)}</pre>
                    </div>
                    <div className={styles.serpSimulator}>
                      <h5>SERP Simulation</h5>
                      <SerpSimulator schemas={finalJsonSchema} />
                    </div>
                  </div>
                </div>
              )}
              <div className={styles.advancedControlsToggle}>
                <button onClick={() => setShowAdvanced(!showAdvanced)}>
                  {showAdvanced ? 'Hide Advanced Controls' : 'Show Advanced Controls'}
                </button>
              </div>
              {showAdvanced && (
                <div className={styles.advancedControlsContainer}>
                  <h4>Schema Sandbox</h4>
                  <SchemaSandbox
                    manualSchemas={manualSchemas}
                    onUpdate={setManualSchemas}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default SearchPreviewModal;
