// Developer Note:
// This component uses a specific three-layer nested structure to achieve the desired visual effect.
// 1. Outermost `div` (bg-black): Provides the full edge-to-edge black background.
// 2. Middle `div` (bg-gray-800 mx-px): Creates the grey container that is "1px shy" of the screen edge.
// 3. Innermost `div` (px-[2px]): Wraps the text fields and provides the 2px internal padding.
// Please do not alter this structure without a clear understanding of the design goal.

import { h } from 'preact';
import LexicalField from './LexicalField';

export default function HeroEditor({ props, onChange }) {
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  return (
    <div class="bg-transparent">
      <div class="bg-gray-800 mx-px" style="box-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
        <div class="px-[2px]">
          <LexicalField
            value={props?.title || ''}
            onChange={(newValue) => handleFieldChange('title', newValue)}
            placeholder="Enter your title (H1)"
            className="text-5xl font-extrabold text-white tracking-tight"
          />
          <LexicalField
            value={props?.subtitle || ''}
            onChange={(newValue) => handleFieldChange('subtitle', newValue)}
            placeholder="Enter your slogan (optional)"
            className="text-lg text-gray-400"
          />
          <LexicalField
            value={props?.body || ''}
            onChange={(newValue) => handleFieldChange('body', newValue)}
            placeholder="Enter your paragraph (optional)"
            className="text-lg text-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
