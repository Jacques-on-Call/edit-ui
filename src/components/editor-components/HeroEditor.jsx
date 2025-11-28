import { h } from 'preact';
import LexicalField from './LexicalField';

export default function HeroEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    // Note: Padding is intentionally managed for a mobile-first, document-like feel.
    <div class="flex flex-col px-2">
      <LexicalField
        value={props?.title || ''}
        onChange={(newValue) => handleFieldChange('title', newValue)}
        placeholder="Enter your title (H1)"
        className="text-4xl font-bold text-white tracking-tight"
      />
      <LexicalField
        value={props?.subtitle || ''}
        onChange={(newValue) => handleFieldChange('subtitle', newValue)}
        placeholder="Enter your slogan (optional)"
        className="text-lg text-gray-400"
      />
      <LexicalField
        value={props?.body || ''}
        onChange={(newValue) => handleFieldChange('body', newValue)}
        placeholder="Enter your paragraph (optional)"
        className="text-base text-gray-300"
      />
    </div>
  );
}
