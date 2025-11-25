import { h } from 'preact';
import EditableField from './EditableField';

export default function FooterEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="flex flex-col text-center items-center py-8">
      <EditableField
        value={props?.copyright || ''}
        onChange={(newValue) => handleFieldChange('copyright', newValue)}
        placeholder="© 2025 Your Company"
        className="text-sm text-gray-400"
      />
      <EditableField
        value={props?.links || ''}
        onChange={(newValue) => handleFieldChange('links', newValue)}
        placeholder="Privacy Policy | Terms of Service"
        className="mt-2 text-sm text-gray-500"
      />
    </div>
  );
}
