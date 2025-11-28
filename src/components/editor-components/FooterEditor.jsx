import { h } from 'preact';
import LexicalField from './LexicalField';

export default function FooterEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="flex flex-col text-center items-center py-8">
      <LexicalField
        value={props?.copyright || ''}
        onChange={(newValue) => handleFieldChange('copyright', newValue)}
        placeholder="© 2025 Your Company"
        className="text-sm text-gray-400"
      />
      <LexicalField
        value={props?.links || ''}
        onChange={(newValue) => handleFieldChange('links', newValue)}
        placeholder="Privacy Policy | Terms of Service"
        className="text-sm text-gray-500"
      />
    </div>
  );
}
