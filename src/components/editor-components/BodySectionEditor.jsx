// Developer Note:
// This component uses a specific three-layer nested structure to achieve the desired visual effect.
// 1. Outermost `div` (bg-black): Provides the full edge-to-edge black background.
// 2. Middle `div` (bg-gray-800 mx-px): Creates the grey container that is "1px shy" of the screen edge.
// 3. Innermost `div` (px-[2px]): Wraps the text fields and provides the 2px internal padding.
// Please do not alter this structure without a clear understanding of the design goal.

import { h } from 'preact';
import { useState } from 'preact/hooks';
import LexicalField from './LexicalField';
import { Image } from 'lucide-preact';
import { useAuth } from '../../contexts/AuthContext';
import { getPreviewImageUrl } from '../../lib/imageHelpers';

export default function BodySectionEditor({ props, onChange }) {
  console.log('[BodySectionEditor] RENDER', { props });
  const authContext = useAuth();
  const { selectedRepo } = authContext;
  console.log('[BodySectionEditor] authContext:', JSON.stringify({ 
    hasUser: !!authContext.user,
    hasSelectedRepo: !!selectedRepo,
    selectedRepoFullName: selectedRepo?.full_name 
  }));
  const [imageError, setImageError] = useState(false);
  
  const handleFieldChange = (fieldName, fieldValue) => {
    onChange({ ...props, [fieldName]: fieldValue });
  };

  const rawImagePath = props?.featureImage || props?.headerImageUrl;
  const imageUrl = getPreviewImageUrl(rawImagePath, selectedRepo?.full_name);

  // Handle image load error - use state to conditionally render
  const handleImageError = () => {
    setImageError(true);
    console.warn('[BodySectionEditor] Image failed to load:', rawImagePath);
  };

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
                  onLoad={() => console.log('[BodySectionEditor] Image loaded successfully:', imageUrl)}
                  onError={handleImageError}
                />
              ) : (
                <div class="flex flex-col items-center justify-center p-4 text-red-400 text-sm">
                  <p>Image failed to load</p>
                  <p class="text-xs text-gray-500 mt-1 break-all">{rawImagePath}</p>
                  <p class="text-xs text-gray-500 mt-1 break-all">Attempted URL: {imageUrl}</p>
                </div>
              )}
            </div>
          )}
          {rawImagePath && !imageUrl && (
            <div class="flex flex-col items-center justify-center p-4 text-yellow-400 text-sm bg-gray-800/50 rounded-lg mb-4">
              <p>Could not construct image URL</p>
              <p class="text-xs text-gray-500 mt-1 break-all">Path: {rawImagePath}</p>
              <p class="text-xs text-gray-500 mt-1">Check console for auth context details</p>
            </div>
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
