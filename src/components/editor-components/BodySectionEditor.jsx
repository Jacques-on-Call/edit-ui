import { h } from 'preact';
import LexicalField from './LexicalField';
import { Image } from 'lucide-preact';

export default function BodySectionEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    // DEV NOTE: Do not add horizontal padding (e.g., px-2) to this container.
    // The parent layout is responsible for managing horizontal spacing.
    // This ensures a consistent edge-to-edge look for all sections.
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
          className="text-4xl font-extrabold text-white tracking-tight"
        />
        <LexicalField
          value={props?.body || ''}
          onChange={(newValue) => handleFieldChange('body', newValue)}
          placeholder="Start writing your content for this section..."
          className="text-lg text-gray-300 -mt-8"
        />
      </div>
    </div>
  );
}
