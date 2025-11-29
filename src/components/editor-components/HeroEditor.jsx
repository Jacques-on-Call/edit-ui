import { h } from 'preact';
import LexicalField from './LexicalField';

export default function HeroEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    // DEV NOTE: All styling in this component, including padding and negative
    // margins, is highly specific to the design. Do not make any style
    // changes without explicit consent from the project lead.
    <div class="flex flex-col">
      <LexicalField
        value={props?.title || ''}
        onChange={(newValue) => handleFieldChange('title', newValue)}
        placeholder="Enter your title (H1)"
        className="text-5xl font-extrabold text-white tracking-tight px-2"
      />
      <LexicalField
        value={props?.subtitle || ''}
        onChange={(newValue) => handleFieldChange('subtitle', newValue)}
        placeholder="Enter your slogan (optional)"
        className="text-lg text-gray-400 -mt-8 px-2"
      />
      <LexicalField
        value={props?.body || ''}
        onChange={(newValue) => handleFieldChange('body', newValue)}
        placeholder="Enter your paragraph (optional)"
        className="text-lg text-gray-300 -mt-8 px-2"
      />
    </div>
  );
}
