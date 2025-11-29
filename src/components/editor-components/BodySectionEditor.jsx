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
import { Image } from 'lucide-preact';

export default function BodySectionEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="flex flex-col">
      {props?.featureImage && (
        <img
          src={props.featureImage}
          alt={props?.title || 'Section image'}
          class="w-full h-64 object-cover rounded-lg mb-4"
        />
      )}

      <div class="flex flex-col">
        <LexicalField
          value={props?.title || ''}
          onChange={(newValue) => handleFieldChange('title', newValue)}
          placeholder="Add a section title..."
          className="text-4xl font-extrabold text-white tracking-tight px-2"
        />
        <LexicalField
          value={props?.body || ''}
          onChange={(newValue) => handleFieldChange('body', newValue)}
          placeholder="Start writing your content for this section..."
          className="text-lg text-gray-300 -mt-8 px-2"
        />
      </div>
    </div>
  );
}
