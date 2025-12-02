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

  // Support both featureImage and featureImageUrl props for compatibility
  const rawFeatureImage = props?.featureImage || props?.featureImageUrl;

  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  const featureImageUrl = getPreviewImageUrl(rawFeatureImage, selectedRepo?.full_name);
  const backgroundImageUrl = getPreviewImageUrl(props?.backgroundImageUrl, selectedRepo?.full_name);

  const hasBackgroundImage = !!backgroundImageUrl;

  // Background style if background image is present
  const containerStyle = hasBackgroundImage
    ? {
      boxShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    : { boxShadow: '2px 2px 4px rgba(0,0,0,0.5)' };

  // When a background image exists, make the container semi-transparent.
  // REMOVED: drop-shadow-lg from textShadowClass as requested.
  const containerClass = hasBackgroundImage ? 'bg-black/50 mx-px' : 'bg-gray-800 mx-px';

  // Determine text colors based on prop (default to white if not specified)
  const textColorMode = props?.textColor || 'white';
  const titleColorClass = textColorMode === 'black' ? 'text-black' : 'text-white';
  const subtitleColorClass = textColorMode === 'black' ? 'text-gray-800' : 'text-gray-400';
  const bodyColorClass = textColorMode === 'black' ? 'text-gray-900' : 'text-gray-300';

  return (
    <div class="bg-transparent">
      <div class={containerClass} style={containerStyle}>
        <div class="px-[2px]">
          {featureImageUrl && (
            <div class="relative min-h-[50px] bg-gray-800/50 rounded-lg overflow-hidden mb-4">
              {!imageError ? (
                <img
                  src={featureImageUrl}
                  alt={props?.featureImageAlt || props?.title || 'Hero feature image'}
                  class="w-full h-64 object-cover rounded-lg"
                  style={{ minHeight: '100px' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div class="flex flex-col items-center justify-center p-4 text-amber-400 text-sm">
                  <p class="font-medium">Image failed to load</p>
                  <p class="text-xs text-gray-400 mt-1">The image could not be loaded from the repository.</p>
                  <p class="text-xs text-gray-500 mt-2 break-all">Path: {rawFeatureImage}</p>
                </div>
              )}
            </div>
          )}
          <LexicalField
            value={props?.title || ''}
            onChange={(newValue) => handleFieldChange('title', newValue)}
            placeholder="Enter your title (H1)"
            className={`text-5xl font-extrabold tracking-tight ${titleColorClass}`}
            transparentBg={hasBackgroundImage}
          />
          <LexicalField
            value={props?.subtitle || ''}
            onChange={(newValue) => handleFieldChange('subtitle', newValue)}
            placeholder="Enter your slogan (optional)"
            className={`text-lg ${subtitleColorClass}`}
            transparentBg={hasBackgroundImage}
          />
          <LexicalField
            value={props?.body || ''}
            onChange={(newValue) => handleFieldChange('body', newValue)}
            placeholder="Enter your paragraph (optional)"
            className={`text-lg ${bodyColorClass}`}
            transparentBg={hasBackgroundImage}
          />
        </div>
      </div>
    </div>
  );
}
