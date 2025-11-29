import { h } from 'preact';
import LexicalField from './LexicalField';
import { Image } from 'lucide-preact';

export default function BodySectionEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  // A simple placeholder for when there's no image
  const ImagePlaceholder = () => (
    <div class="bg-gray-700 w-full h-64 flex items-center justify-center rounded-lg mb-4">
      <div class="text-center text-gray-400">
        <Image size={48} className="mx-auto" />
        <p>No image selected.</p>
        <p class="text-sm">(Image URL can be added in Raw JSON editor)</p>
      </div>
    </div>
  );

  return (
    <div class="flex flex-col p-4 bg-gray-800 rounded-lg shadow-lg mb-4">
      {props?.featureImage ? (
        <img
          src={props.featureImage}
          alt={props?.title || 'Section image'}
          class="w-full h-64 object-cover rounded-t-lg mb-4"
        />
      ) : (
        <ImagePlaceholder />
      )}

      <div class="flex flex-col px-2">
        <LexicalField
          value={props?.title || ''}
          onChange={(newValue) => handleFieldChange('title', newValue)}
          placeholder="Add a section title..."
          className="text-4xl font-extrabold text-white tracking-tight mb-2"
        />
        <LexicalField
          value={props?.body || ''}
          onChange={(newValue) => handleFieldChange('body', newValue)}
          placeholder="Start writing your content for this section..."
          className="text-lg text-gray-300"
        />
      </div>
    </div>
  );
}
