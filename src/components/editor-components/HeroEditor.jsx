import { h } from 'preact';
import LexicalField from './LexicalField';

export default function HeroEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    // DEV NOTE: Do not add horizontal padding (e.g., px-2) to this container.
    // The parent layout is responsible for managing horizontal spacing.
    // This ensures a consistent edge-to-edge look for all sections.
    <div class="flex flex-col">
      <LexicalField
        value={props?.title || ''}
        onChange={(newValue) => handleFieldChange('title', newValue)}
        placeholder="Enter your title (H1)"
        className="text-5xl font-extrabold text-white tracking-tight"
      />
      <LexicalField
        value={props?.subtitle || ''}
        onChange={(newValue) => handleFieldChange('subtitle', newValue)}
        placeholder="Enter your slogan (optional)"
        className="text-lg text-gray-400 -mt-8"
      />
      <LexicalField
        value={props?.body || ''}
        onChange={(newValue) => handleFieldChange('body', newValue)}
        placeholder="Enter your paragraph (optional)"
        className="text-lg text-gray-300 -mt-8"
      />
    </div>
  );
}
