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

export default function BodySectionEditor({ props, onChange }) {
  const { selectedRepo } = useAuth();
  // Track if primary URL failed and we're using fallback
  const [imageUseFallback, setImageUseFallback] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const rawImagePath = props?.featureImage || props?.headerImageUrl;
  
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  // Primary: proxy URL, Fallback: GitHub raw URL
  const imageProxyUrl = getPreviewImageUrl(rawImagePath, selectedRepo?.full_name);
  const imageRawUrl = getGitHubRawUrl(rawImagePath, selectedRepo?.full_name);
  const imageUrl = imageUseFallback ? imageRawUrl : imageProxyUrl;

  return (
    <div class="bg-transparent">
      <div class="bg-gray-800 mx-px" style="box-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
        <div class="px-[2px]">
          {imageUrl && (
            <div class="relative min-h-[50px] bg-gray-800/50 rounded-lg overflow-hidden mb-4">
              {!imageError ? (
                <img
                  src={imageUrl}
                  alt={props?.headerImageAlt || props?.title || 'Section image'}
                  class="w-full h-64 object-cover rounded-lg"
                  style={{ minHeight: '100px' }}
                  onError={() => {
                    // Try fallback URL if primary fails, otherwise show error
                    if (!imageUseFallback && imageRawUrl) {
                      setImageUseFallback(true);
                    } else {
                      setImageError(true);
                    }
                  }}
                />
              ) : (
                <div class="flex flex-col items-center justify-center p-4 text-amber-400 text-sm">
                  <p class="font-medium">Image failed to load</p>
                  <p class="text-xs text-gray-400 mt-1">The image could not be loaded from the repository.</p>
                  <p class="text-xs text-gray-500 mt-2 break-all">Path: {rawImagePath}</p>
                </div>
              )}
            </div>
          )}
          <div class="flex flex-col">
            {/* H2 wrapper with z-index and overflow visible to prevent descender clipping */}
            <div class="relative z-10 pb-2" style={{ overflow: 'visible' }}>
              <LexicalField
                value={props?.title || ''}
                onChange={(newValue) => handleFieldChange('title', newValue)}
                placeholder="Add a section title..."
                className="text-4xl font-extrabold text-white tracking-tight"
              />
            </div>
            <LexicalField
              value={props?.body || ''}
              onChange={(newValue) => handleFieldChange('body', newValue)}
              placeholder="Start writing your content for this section..."
              className="text-lg text-gray-300 -mt-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
