import { h } from 'preact';
import EditableField from './EditableField';

export default function HeroEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="flex flex-col">
      <EditableField
        value={props?.title || ''}
        onChange={(newValue) => handleFieldChange('title', newValue)}
        placeholder="Hero Title"
        className="text-4xl font-bold text-white tracking-tight"
      />
      <EditableField
        value={props?.subtitle || ''}
        onChange={(newValue) => handleFieldChange('subtitle', newValue)}
        placeholder="Enter a subtitle..."
        className="mt-2 text-lg text-gray-400"
      />
      <EditableField
        value={props?.body || ''}
        onChange={(newValue) => handleFieldChange('body', newValue)}
        placeholder="Start writing the body content..."
        className="mt-4 text-base text-gray-300"
      />
    </div>
  );
}
