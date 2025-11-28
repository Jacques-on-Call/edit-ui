import { h } from 'preact';
import LexicalField from './LexicalField';

export default function TextSectionEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    // Note: Padding is intentionally managed by the parent layout.
    // This component is designed to be edge-to-edge on mobile for a document-like feel.
    <div class="flex flex-col">
      <LexicalField
        value={props?.title || ''}
        onChange={(newValue) => handleFieldChange('title', newValue)}
        placeholder="Add a section title..."
        className="text-3xl font-bold text-white tracking-tight"
      />
      <LexicalField
        value={props?.body || ''}
        onChange={(newValue) => handleFieldChange('body', newValue)}
        placeholder="Start writing your content for this section..."
        className="text-base text-gray-300 mt-1"
      />
    </div>
  );
}
