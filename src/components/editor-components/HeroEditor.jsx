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
import { getPreviewImageUrl, getGitHubRawUrl } from '../../lib/imageHelpers';

export default function HeroEditor({ props, onChange }) {
  const { selectedRepo } = useAuth();
  // Track if primary URL failed and we're using fallback
  const [featureImageUseFallback, setFeatureImageUseFallback] = useState(false);
  const [featureImageError, setFeatureImageError] = useState(false);
  const [bgImageUseFallback, setBgImageUseFallback] = useState(false);

  // Support both featureImage and featureImageUrl props for compatibility
  const rawFeatureImage = props?.featureImage || props?.featureImageUrl;

  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  // Primary: proxy URL, Fallback: GitHub raw URL
  const featureImageProxyUrl = getPreviewImageUrl(rawFeatureImage, selectedRepo?.full_name);
  const featureImageRawUrl = getGitHubRawUrl(rawFeatureImage, selectedRepo?.full_name);
  const featureImageUrl = featureImageUseFallback ? featureImageRawUrl : featureImageProxyUrl;

  const backgroundImageProxyUrl = getPreviewImageUrl(props?.backgroundImageUrl, selectedRepo?.full_name);
  const backgroundImageRawUrl = getGitHubRawUrl(props?.backgroundImageUrl, selectedRepo?.full_name);
  const backgroundImageUrl = bgImageUseFallback ? backgroundImageRawUrl : backgroundImageProxyUrl;

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
  const isDarkText = textColorMode === 'black';
  const titleColorClass = isDarkText ? 'text-black' : 'text-white';
  const subtitleColorClass = isDarkText ? 'text-gray-800' : 'text-gray-400';
  const bodyColorClass = isDarkText ? 'text-gray-900' : 'text-gray-300';

  return (
    <div class="bg-transparent">
      <div class={containerClass} style={containerStyle}>
        <div class="px-[2px]">
          {featureImageUrl && (
            <div class="relative min-h-[50px] bg-gray-800/50 rounded-lg overflow-hidden mb-4">
              {!featureImageError ? (
                <img
                  src={featureImageUrl}
                  alt={props?.featureImageAlt || props?.title || 'Hero feature image'}
                  class="w-full h-64 object-cover rounded-lg"
                  style={{ minHeight: '100px' }}
                  onError={() => {
                    // Try fallback URL if primary fails, otherwise show error
                    if (!featureImageUseFallback && featureImageRawUrl) {
                      setFeatureImageUseFallback(true);
                    } else {
                      setFeatureImageError(true);
                    }
                  }}
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
            darkText={isDarkText}
          />
          <LexicalField
            value={props?.subtitle || ''}
            onChange={(newValue) => handleFieldChange('subtitle', newValue)}
            placeholder="Enter your slogan (optional)"
            className={`text-lg ${subtitleColorClass}`}
            transparentBg={hasBackgroundImage}
            darkText={isDarkText}
          />
          <LexicalField
            value={props?.body || ''}
            onChange={(newValue) => handleFieldChange('body', newValue)}
            placeholder="Enter your paragraph (optional)"
            className={`text-lg ${bodyColorClass}`}
            transparentBg={hasBackgroundImage}
            darkText={isDarkText}
          />
        </div>
      </div>
    </div>
  );
}
