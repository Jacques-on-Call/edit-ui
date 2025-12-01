// Developer Note:
// This component uses a specific three-layer nested structure to achieve the desired visual effect.
// 1. Outermost `div` (bg-black): Provides the full edge-to-edge black background.
// 2. Middle `div` (bg-gray-800 mx-px): Creates the grey container that is "1px shy" of the screen edge.
// 3. Innermost `div` (px-[2px]): Wraps the text fields and provides the 2px internal padding.
// Please do not alter this structure without a clear understanding of the design goal.

import { h } from 'preact';
import { useState } from 'preact/hooks';
import LexicalField from './LexicalField';
import { useAuth } from '../../contexts/AuthContext';
import { getPreviewImageUrl } from '../../lib/imageHelpers';

export default function HeroEditor({ props, onChange }) {
  const { selectedRepo } = useAuth();
  const [imageError, setImageError] = useState(false);
  
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  // Support both featureImage and featureImageUrl props for compatibility
  const rawFeatureImage = props?.featureImage || props?.featureImageUrl;
  const featureImageUrl = getPreviewImageUrl(rawFeatureImage, selectedRepo?.full_name);
  const backgroundImageUrl = getPreviewImageUrl(props?.backgroundImageUrl, selectedRepo?.full_name);

  // Handle image load error - use state to conditionally render
  const handleImageError = () => {
    setImageError(true);
    console.warn('[HeroEditor] Image failed to load:', rawFeatureImage);
  };

  // Background style if background image is present
  const containerStyle = backgroundImageUrl
    ? {
        boxShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { boxShadow: '2px 2px 4px rgba(0,0,0,0.5)' };

  return (
    <div class="bg-transparent">
      <div class="bg-gray-800 mx-px" style={containerStyle}>
        <div class="px-[2px]">
          {featureImageUrl && !imageError && (
            <img
              src={featureImageUrl}
              alt={props?.featureImageAlt || props?.title || 'Hero feature image'}
              class="w-full h-64 object-cover rounded-lg mb-4"
              onError={handleImageError}
            />
          )}
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
