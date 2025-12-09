// Developer Note:
// This component uses a specific three-layer nested structure to achieve the desired visual effect.
// 1. Outermost `div` (bg-black): Provides the full edge-to-edge black background.
// 2. Middle `div` (bg-gray-800 mx-px): Creates the grey container that is "1px shy" of the screen edge.
// 3. Innermost `div` (px-[2px]): Wraps the text fields and provides the 2px internal padding.
// Please do not alter this structure without a clear understanding of the design goal.
//
// Text color is now handled via inline Lexical formatting (toolbar color picker) rather than
// a section-level base color. Users can select text and apply colors directly.

import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
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

  const handleFieldChange = useCallback((fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  }, [onChange, props]);

  const handleTitleChange = useCallback((newValue) => handleFieldChange('title', newValue), [handleFieldChange]);
  const handleSubtitleChange = useCallback((newValue) => handleFieldChange('subtitle', newValue), [handleFieldChange]);
  const handleBodyChange = useCallback((newValue) => handleFieldChange('body', newValue), [handleFieldChange]);

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
  const containerClass = hasBackgroundImage ? 'bg-black/50 mx-px' : 'bg-gray-800 mx-px';

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
            onChange={handleTitleChange}
            placeholder="Enter your title (H1)"
            className="text-5xl font-extrabold tracking-tight text-white"
            transparentBg={hasBackgroundImage}
          />
          <LexicalField
            value={props?.subtitle || ''}
            onChange={handleSubtitleChange}
            placeholder="Enter your slogan (optional)"
            className="text-lg text-gray-400"
            transparentBg={hasBackgroundImage}
          />
          <LexicalField
            value={props?.body || ''}
            onChange={handleBodyChange}
            placeholder="Enter your paragraph (optional)"
            className="text-lg text-gray-300"
            transparentBg={hasBackgroundImage}
          />
        </div>
      </div>
    </div>
  );
}
