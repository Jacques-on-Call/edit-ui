import { useState } from 'react';

// A new sub-component for the visual SERP preview, refactored with Tailwind CSS.
function SerpPreview({ title, description, slug }) {
  const siteUrl = `https://www.strategycontent.agency/${slug}`;
  return (
    <div className="font-sans rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <span className="text-sm text-gray-700">{siteUrl}</span>
      <h3 className="mt-1 mb-1 text-xl text-blue-800">{title || 'Your Title Here'}</h3>
      <p className="m-0 text-sm leading-relaxed text-gray-600">
        {description || 'Your meta description will appear here. Try to keep it under 160 characters.'}
      </p>
    </div>
  );
}

function SearchPreviewModal({
  initialTitle = '',
  initialDescription = '',
  initialSlug = '',
  initialJsonSchema = {},
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('serp');
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [slug, setSlug] = useState(initialSlug);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify(initialJsonSchema, null, 2));

  const handleSave = () => {
    try {
      const parsedJsonSchema = JSON.parse(jsonSchema);
      onSave({ title, description, slug, jsonSchema: parsedJsonSchema });
    } catch (error) {
      alert('The JSON Schema is invalid. Please correct it before saving.');
    }
  };

  const getTabClasses = (tabName) => {
    const baseClasses = "bg-transparent border-none py-3 mr-6 cursor-pointer text-sm font-medium border-b-2 transition-all transform-gpu translate-y-px";
    return activeTab === tabName
      ? `${baseClasses} text-gray-900 border-blue-600`
      : `${baseClasses} text-gray-500 border-transparent`;
  };

  const inputClasses = "w-full py-2 px-3 border border-gray-300 rounded-lg text-base bg-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500";
  const textareaClasses = `${inputClasses} resize-y min-h-[100px]`;
  const jsonEditorClasses = "w-full border border-gray-300 rounded-lg font-mono text-sm p-4 bg-gray-50 text-gray-800 resize-y min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex w-[90%] max-w-3xl max-h-[90vh] flex-col rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 px-6">
          <h2 className="m-0 text-lg font-semibold">Search Preview</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-2xl text-gray-500 transition-colors hover:bg-gray-100">
            &times;
          </button>
        </div>
        <div className="border-b border-gray-200 bg-gray-50/70 px-6">
          <div className="flex">
            <button className={getTabClasses('serp')} onClick={() => setActiveTab('serp')}>
              SERP View
            </button>
            <button className={getTabClasses('json')} onClick={() => setActiveTab('json')}>
              JSON Schema
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-6">
          {activeTab === 'serp' && (
            <div>
              <h4 className="text-base font-semibold mb-3">Live Preview</h4>
              <SerpPreview title={title} description={description} slug={slug} />
              <hr className="my-8 border-0 border-t border-gray-200" />

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="meta-title" className="text-sm font-semibold text-gray-800">Meta Title</label>
                  <span className="text-xs text-gray-500">{title.length} / 60</span>
                </div>
                <input
                  id="meta-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClasses}
                  maxLength="60"
                />
              </div>
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="meta-description" className="text-sm font-semibold text-gray-800">Meta Description</label>
                  <span className="text-xs text-gray-500">{description.length} / 160</span>
                </div>
                <textarea
                  id="meta-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaClasses}
                  rows="4"
                  maxLength="160"
                />
              </div>
              <div>
                <label htmlFor="url-slug" className="mb-2 block text-sm font-semibold text-gray-800">URL Slug</label>
                <input
                  id="url-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          )}
          {activeTab === 'json' && (
            <div>
              <textarea
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
                className={jsonEditorClasses}
                rows="15"
                spellCheck="false"
              />
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 bg-gray-50/70 p-4 px-6 text-right">
          <button className="cursor-pointer rounded-lg border-none bg-blue-600 py-2 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default SearchPreviewModal;