// DEVELOPER NOTE:
// This component is designed to be a full-width, edge-to-edge container.
// All horizontal padding is handled by the inner `LexicalEditor` component
// to ensure consistent text alignment across all sections.
//
// DO NOT ADD PADDING OR MARGINS TO THE ROOT ELEMENT OF THIS COMPONENT.
// This is a critical design requirement. Please consult the project lead
// before making any changes to this file's layout.

import { h } from 'preact';
import LexicalField from './LexicalField';

export default function HeroEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
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
