// easy-seo/src/components/editor-components/ContactFormEditor.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import LexicalField from './LexicalField';
import Icon from '../Icon';

const FieldEditor = ({ field, onUpdate, onRemove, onMove, isFirst, isLast }) => {
  return (
    <div class="flex items-center space-x-2 bg-gray-700 p-2 rounded">
      <div class="flex-grow">
        <input
          type="text"
          class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          value={field}
          onInput={(e) => onUpdate(e.target.value)}
        />
      </div>
      <div class="flex items-center">
        <button onClick={() => onMove('up')} disabled={isFirst} class="text-gray-400 hover:text-white disabled:opacity-50 p-1">
          <Icon name="ChevronUp" size={18} />
        </button>
        <button onClick={() => onMove('down')} disabled={isLast} class="text-gray-400 hover:text-white disabled:opacity-50 p-1">
          <Icon name="ChevronDown" size={18} />
        </button>
        <button onClick={onRemove} class="text-red-500 hover:text-red-400 p-1">
          <Icon name="Trash2" size={18} />
        </button>
      </div>
    </div>
  );
};

export default function ContactFormEditor({ props, onChange }) {
  const fields = props?.fields || ['name', 'email', 'message'];
  const [newField, setNewField] = useState('');

  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  const handleUpdateField = (index, value) => {
    const newFields = [...fields];
    newFields[index] = value;
    handleFieldChange('fields', newFields);
  };

  const handleAddField = () => {
    if (newField.trim() === '') return;
    const newFields = [...fields, newField.trim()];
    handleFieldChange('fields', newFields);
    setNewField('');
  };

  const handleRemoveField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    handleFieldChange('fields', newFields);
  };

  const handleMoveField = (index, direction) => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    handleFieldChange('fields', newFields);
  };

  return (
    <div class="bg-gray-800 p-4 rounded-lg">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Form Title</label>
        <LexicalField
          value={props?.title || 'Contact Us'}
          onChange={(newValue) => handleFieldChange('title', newValue)}
          placeholder="Enter the form title"
          className="text-2xl font-bold text-white mb-4"
        />
      </div>

      <div class="space-y-4">
        <h4 class="text-lg font-semibold text-white mt-4 border-b border-gray-700 pb-2">Form Fields</h4>
        <div class="space-y-2">
          {fields.map((field, index) => (
            <FieldEditor
              key={index}
              field={field}
              onUpdate={(value) => handleUpdateField(index, value)}
              onRemove={() => handleRemoveField(index)}
              onMove={(dir) => handleMoveField(index, dir)}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
            />
          ))}
        </div>

        <div class="flex items-center space-x-2 pt-4">
          <input
            type="text"
            class="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            value={newField}
            onInput={(e) => setNewField(e.target.value)}
            placeholder="Enter new field name (e.g., phone)"
          />
          <button onClick={handleAddField} class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold">
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
}
