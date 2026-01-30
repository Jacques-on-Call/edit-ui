/**
 * ImageEditor Component
 * 
 * This component is used to edit existing images in sections. It provides:
 * - Image preview
 * - Filename editing (SEO-friendly, without showing full path)
 * - Alt text, title, description editing
 * - Option to replace the image
 * - ID (Image Description) Score showing SEO optimization status
 * 
 * The ID Score contributes to the overall Page Score (PS).
 * See: easy-seo/docs/Scoring for Growth Strategy
 * 
 * Unlike ImageUploader which is for new uploads, this component is for
 * editing metadata of existing images.
 */
import { h } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { getPreviewImageUrl } from '../lib/imageHelpers';
import { calculateImageScore, getScoreColorClass, getScoreBgClass, getScoreStatus } from '../lib/imageScoring';
import Icon from './Icon';
import ImageUploader from './ImageUploader';

// Helper to extract just the filename from a path
const getFilenameFromPath = (path) => {
  if (!path) return '';
  return path.split('/').pop() || '';
};

// Helper to get the directory from a path
const getDirectoryFromPath = (path) => {
  if (!path) return '';
  const parts = path.split('/');
  parts.pop(); // Remove filename
  return parts.join('/');
};

// Helper function to generate SEO-friendly filename from text
const generateSeoFilename = (text, extension) => {
  if (!text) return '';
  const sanitized = text
    .toLowerCase()
    .trim()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .substring(0, 60); // Limit length for SEO
  return extension ? `${sanitized}.${extension}` : sanitized;
};

// Tooltip component
const Tooltip = ({ text, children }) => (
  <div class="relative group inline-block">
    {children}
    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
      {text}
      <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function ImageEditor({
  imagePath,
  imageAlt = '',
  imageTitle = '',
  imageDescription = '',
  imageLoading = 'lazy',
  pageSlug,
  topicWords = [], // Topic words from page for ID Score calculation
  onUpdate,
  onRemove,
  label = 'Image'
}) {
  const { selectedRepo } = useAuth();
  const [mode, setMode] = useState('view'); // 'view', 'edit', 'replace'
  const [imageError, setImageError] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Editable fields
  const [filename, setFilename] = useState(getFilenameFromPath(imagePath));
  const [alt, setAlt] = useState(imageAlt);
  const [title, setTitle] = useState(imageTitle);
  const [description, setDescription] = useState(imageDescription);
  const [loading, setLoading] = useState(imageLoading);

  // Track if filename was manually edited
  const [filenameManuallyEdited, setFilenameManuallyEdited] = useState(false);

  // Get the preview URL for displaying the image
  const previewUrl = getPreviewImageUrl(imagePath, selectedRepo?.full_name);

  // Get file extension
  const extension = filename.split('.').pop() || '';
  const filenameWithoutExt = filename.replace(`.${extension}`, '');

  // Calculate ID Score using the scoring module
  const idScore = calculateImageScore({
    filename,
    alt,
    title,
    description,
    loading
  }, topicWords);

  // Reset state when imagePath changes
  useEffect(() => {
    setFilename(getFilenameFromPath(imagePath));
    setAlt(imageAlt);
    setTitle(imageTitle);
    setDescription(imageDescription);
    setLoading(imageLoading);
    setImageError(false);
    setFilenameManuallyEdited(false);
  }, [imagePath, imageAlt, imageTitle, imageDescription, imageLoading]);

  // Auto-generate filename from alt text if not manually edited
  useEffect(() => {
    if (alt && !filenameManuallyEdited && extension) {
      const generated = generateSeoFilename(alt, extension);
      if (generated) {
        setFilename(generated);
      }
    }
  }, [alt, filenameManuallyEdited, extension]);

  // Handle saving changes
  const handleSave = useCallback(() => {
    const directory = getDirectoryFromPath(imagePath);
    const newPath = directory ? `${directory}/${filename}` : filename;

    onUpdate({
      path: newPath,
      alt: alt,
      title: title,
      description: description,
      loading: loading,
      idScore: idScore.total, // Include ID Score in update
      // Pass the original path so we know if rename is needed
      originalPath: imagePath
    });

    setMode('view');
  }, [imagePath, filename, alt, title, description, loading, idScore.total, onUpdate]);

  // Handle image replacement from ImageUploader
  const handleReplaceComplete = useCallback(({ path, alt: newAlt, title: newTitle, description: newDesc, loading: newLoading }) => {
    onUpdate({
      path: path,
      alt: newAlt || alt,
      title: newTitle || title,
      description: newDesc || description,
      loading: newLoading || loading,
      originalPath: imagePath,
      isReplacement: true
    });
    setMode('view');
  }, [imagePath, alt, title, description, loading, onUpdate]);

  // Helper to render a score detail row
  const renderScoreDetail = (label, detail, points) => {
    const statusColors = {
      optimal: 'text-green-400',
      good: 'text-green-400',
      partial: 'text-yellow-400',
      poor: 'text-orange-400',
      missing: 'text-gray-400',
      na: 'text-gray-500',
      unknown: 'text-gray-500'
    };

    return (
      <div class="flex items-center justify-between text-xs py-1 border-b border-gray-700 last:border-0">
        <span class="text-gray-400">{label}</span>
        <div class="flex items-center gap-2">
          <span class={statusColors[detail?.status] || 'text-gray-500'}>
            {detail?.message || 'N/A'}
          </span>
          <span class="text-gray-500 w-8 text-right">+{points}</span>
        </div>
      </div>
    );
  };

  // Render view mode - shows the current image with edit button
  if (mode === 'view') {
    return (
      <div class="border border-gray-600 rounded-lg overflow-hidden">
        <div class="bg-gray-800/50 p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-300">{label}</span>
            <div class="flex gap-2">
              <button
                onClick={() => setMode('edit')}
                class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Edit image settings"
              >
                <Icon name="Edit2" size={14} />
                <span>Edit</span>
              </button>
              {onRemove && (
                <button
                  onClick={onRemove}
                  class="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded transition-colors"
                  title="Remove image"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Image Preview */}
          <div class="relative bg-gray-900 rounded-lg overflow-hidden">
            {previewUrl && !imageError ? (
              <img
                src={previewUrl}
                alt={alt || 'Image preview'}
                class="w-full h-32 object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div class="w-full h-32 flex items-center justify-center text-gray-500">
                <Icon name="Image" size={40} />
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div class="mt-2 space-y-1">
            <p class="text-xs text-gray-400 truncate" title={filename}>
              <span class="text-gray-500">Filename:</span> {filename}
            </p>
            {alt && (
              <p class="text-xs text-gray-400 truncate" title={alt}>
                <span class="text-gray-500">Alt:</span> {alt}
              </p>
            )}
            <div class="flex items-center justify-between">
              <button
                onClick={() => setShowScoreDetails(!showScoreDetails)}
                class={`text-xs flex items-center gap-1 ${getScoreColorClass(idScore.total)} hover:underline`}
              >
                ID Score: {idScore.total}/100
                <Icon name="Info" size={12} />
              </button>
              <span class="text-xs text-gray-500">{getScoreStatus(idScore.total)}</span>
            </div>

            {/* ID Score Details (collapsible) */}
            {showScoreDetails && (
              <div class="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                <p class="text-xs text-gray-300 mb-2 font-medium">Score Breakdown:</p>
                {renderScoreDetail('Filename SEO', idScore.details.filename, idScore.filenameScore)}
                {renderScoreDetail('Alt Text', idScore.details.altText, idScore.altTextScore)}
                {renderScoreDetail('Title', idScore.details.title, idScore.titleScore)}
                {renderScoreDetail('Description', idScore.details.description, idScore.descriptionScore)}
                {renderScoreDetail('Lazy Loading', idScore.details.loading, idScore.lazyLoadingScore)}
                {topicWords.length > 0 && (
                  <>
                    {renderScoreDetail('Topic Words (Filename)', idScore.details.topicWordsFilename, idScore.topicWordsFilenameScore)}
                    {renderScoreDetail('Topic Words (Alt)', idScore.details.topicWordsAlt, idScore.topicWordsAltScore)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render replace mode - shows ImageUploader
  if (mode === 'replace') {
    return (
      <div class="border border-gray-600 rounded-lg overflow-hidden">
        <div class="bg-gray-800/50 p-3">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-300">Replace {label}</span>
            <button
              onClick={() => setMode('edit')}
              class="text-xs text-gray-400 hover:text-white"
            >
              ← Back
            </button>
          </div>
          <ImageUploader
            pageSlug={pageSlug}
            onComplete={handleReplaceComplete}
          />
        </div>
      </div>
    );
  }

  // Render edit mode - shows editable fields
  return (
    <div class="border border-gray-600 rounded-lg overflow-hidden">
      <div class="bg-gray-800/50 p-3">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-300">Edit {label}</span>
          <div class="flex gap-2">
            <button
              onClick={() => setMode('view')}
              class="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              class="flex items-center gap-1 px-2 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
            >
              <Icon name="CheckCircle" size={14} />
              Save
            </button>
          </div>
        </div>

        {/* Image Preview */}
        <div class="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
          {previewUrl && !imageError ? (
            <img
              src={previewUrl}
              alt={alt || 'Image preview'}
              class="w-full h-32 object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div class="w-full h-32 flex items-center justify-center text-gray-500">
              <Icon name="Image" size={40} />
            </div>
          )}
          <button
            onClick={() => setMode('replace')}
            class="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 text-xs bg-gray-900/80 hover:bg-gray-800 text-white rounded transition-colors"
          >
            <Icon name="RefreshCw" size={12} />
            Replace Image
          </button>
        </div>

        {/* ID Score - Live feedback as user edits */}
        <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-2 mb-4">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-gray-400">ID Score</span>
              <button
                onClick={() => setShowScoreDetails(!showScoreDetails)}
                class="text-xs text-gray-500 hover:text-white"
              >
                {showScoreDetails ? '▲ Hide' : '▼ Details'}
              </button>
            </div>
            <span class={`text-sm font-bold ${getScoreColorClass(idScore.total)}`}>
              {idScore.total}/100
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-1.5">
            <div
              class={`h-1.5 rounded-full transition-all ${getScoreBgClass(idScore.total)}`}
              style={{ width: `${idScore.total}%` }}
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">{getScoreStatus(idScore.total)} - This score contributes to your Page Score</p>

          {/* Detailed breakdown */}
          {showScoreDetails && (
            <div class="mt-2 pt-2 border-t border-gray-700">
              {renderScoreDetail('Filename SEO', idScore.details.filename, idScore.filenameScore)}
              {renderScoreDetail('Alt Text', idScore.details.altText, idScore.altTextScore)}
              {renderScoreDetail('Title', idScore.details.title, idScore.titleScore)}
              {renderScoreDetail('Description', idScore.details.description, idScore.descriptionScore)}
              {renderScoreDetail('Lazy Loading', idScore.details.loading, idScore.lazyLoadingScore)}
              {topicWords.length > 0 && (
                <>
                  {renderScoreDetail('Topic Words (Filename)', idScore.details.topicWordsFilename, idScore.topicWordsFilenameScore)}
                  {renderScoreDetail('Topic Words (Alt)', idScore.details.topicWordsAlt, idScore.topicWordsAltScore)}
                </>
              )}
            </div>
          )}
        </div>

        <div class="space-y-3">
          {/* Filename */}
          <div>
            <label class="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1">
              Filename
              <Tooltip text="SEO-friendly filename. Auto-generated from alt text. Edit to customize.">
                <Icon name="HelpCircle" size={12} class="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={filename}
              onInput={(e) => {
                setFilename(e.target.value);
                setFilenameManuallyEdited(true);
              }}
              class="w-full px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-lime"
            />
            {filename.includes(' ') && (
              <p class="text-xs text-amber-400 mt-0.5">⚠️ Spaces are not SEO-friendly. Use hyphens instead.</p>
            )}
          </div>

          {/* Alt Text */}
          <div>
            <label class="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1">
              Alt Text
              <Tooltip text="Describes the image for screen readers and SEO. Keep it descriptive but concise.">
                <Icon name="HelpCircle" size={12} class="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={alt}
              onInput={(e) => setAlt(e.target.value)}
              placeholder="e.g., Beautiful sunset over mountains"
              class="w-full px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-lime"
            />
            <div class="flex justify-between mt-0.5">
              <p class="text-xs text-gray-500">
                {alt.length > 0 && (alt.length < 10 ? '⚠️ Too short' : alt.length > 125 ? '⚠️ Too long' : '✓ Good length')}
              </p>
              <p class="text-xs text-gray-500">{alt.length}/125</p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label class="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1">
              Title (Optional)
              <Tooltip text="Appears as tooltip on hover. Adds extra context for users.">
                <Icon name="HelpCircle" size={12} class="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <input
              type="text"
              value={title}
              onInput={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunset Photography"
              class="w-full px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-lime"
            />
          </div>

          {/* Description */}
          <div>
            <label class="flex items-center gap-1 text-xs font-medium text-gray-300 mb-1">
              Description (Optional)
              <Tooltip text="Additional context about the image. Useful for captions.">
                <Icon name="HelpCircle" size={12} class="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <textarea
              value={description}
              onInput={(e) => setDescription(e.target.value)}
              placeholder="e.g., A breathtaking view captured during golden hour..."
              class="w-full px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-lime"
              rows="2"
            />
          </div>

          {/* Loading Strategy */}
          <div>
            <label class="block text-xs font-medium text-gray-300 mb-1">Loading Strategy</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="imageLoading"
                  value="lazy"
                  checked={loading === 'lazy'}
                  onChange={() => setLoading('lazy')}
                  class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
                />
                <span class="text-xs text-white">Lazy</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="imageLoading"
                  value="eager"
                  checked={loading === 'eager'}
                  onChange={() => setLoading('eager')}
                  class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
                />
                <span class="text-xs text-white">Eager (for hero images)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
