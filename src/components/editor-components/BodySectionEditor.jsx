// Developer Note:
// This component uses a specific three-layer nested structure to achieve the desired visual effect.
// 1. Outermost `div` (bg-black): Provides the full edge-to-edge black background.
// 2. Middle `div` (bg-gray-800 mx-px): Creates the grey container that is "1px shy" of the screen edge.
// 3. Innermost `div` (px-[2px]): Wraps the text fields and provides the 2px internal padding.
// Please do not alter this structure without a clear understanding of the design goal.

import { h } from 'preact';
import LexicalField from './LexicalField';
import { Image } from 'lucide-preact';

export default function BodySectionEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="bg-transparent">
      <div class="bg-gray-800 mx-px" style="box-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
        <div class="px-[2px]">
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
      </div>
    </div>
  );
}
