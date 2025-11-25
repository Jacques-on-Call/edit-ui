import { h } from 'preact';
import EditableField from './EditableField';

export default function TextSectionEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="flex flex-col">
      <EditableField
        value={props?.title || ''}
        onChange={(newValue) => handleFieldChange('title', newValue)}
        placeholder="Add a section title..."
        className="text-3xl font-bold text-white tracking-tight"
      />
      <EditableField
        value={props?.body || ''}
        onChange={(newValue) => handleFieldChange('body', newValue)}
        placeholder="Start writing your content for this section..."
        className="mt-4 text-base text-gray-300"
      />
    </div>
  );
}
