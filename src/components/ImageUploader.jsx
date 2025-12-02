import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud, RefreshCw, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-preact';

// Helper function to generate SEO-friendly filename from text
const generateSeoFilename = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .substring(0, 60); // Limit length for SEO
};

// Helper function to resize image while preserving aspect ratio
const resizeImage = (file, maxWidth, maxHeight) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while preserving aspect ratio
        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              blob,
              width: Math.round(width),
              height: Math.round(height),
              originalWidth: img.width,
              originalHeight: img.height
            });
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, file.type, 0.9); // 0.9 quality for good balance
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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

export default function ImageUploader({ pageSlug, onComplete }) {
  const { selectedRepo } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [altText, setAltText] = useState('');
  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState('lazy');
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState(null);
  const [resizeInfo, setResizeInfo] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-generate filename from alt text
  useEffect(() => {
    if (altText && file) {
      const extension = file.name.split('.').pop();
      const generatedName = generateSeoFilename(altText);
      if (generatedName) {
        setFilename(`${generatedName}.${extension}`);
      }
    }
  }, [altText, file]);

  // Calculate SEO score
  const calculateSeoScore = () => {
    let score = 0;
    if (altText && altText.length >= 10 && altText.length <= 125) score += 40;
    else if (altText) score += 20;
    if (filename && filename.length > 0) score += 20;
    if (title) score += 15;
    if (description) score += 15;
    if (loading === 'lazy') score += 10;
    return score;
  };

  const seoScore = calculateSeoScore();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setStatus('idle');
      setError(null);
      setResizeInfo(null);

      // Set initial filename from original file
      const extension = selectedFile.name.split('.').pop();
      const baseName = selectedFile.name.substring(0, selectedFile.name.length - extension.length - 1);
      setFilename(selectedFile.name);
    }
  };

  const handleUpload = async () => {
    console.log('[ImageUploader] handleUpload triggered.');
    if (!file || !selectedRepo) {
      console.error('[ImageUploader] Pre-flight check failed. File or repo missing.', { hasFile: !!file, hasRepo: !!selectedRepo });
      setError('Please select a file and ensure a repository is selected.');
      return;
    }

    if (!altText.trim()) {
      setError('Alt text is required for SEO and accessibility.');
      return;
    }

    console.log('[ImageUploader] Setting status to "uploading".');
    setStatus('uploading');
    setError(null);

    try {
      let fileToUpload = file;

      // Resize image if dimensions are specified
      if (maxWidth || maxHeight) {
        console.log('[ImageUploader] Resizing image...');
        const resizeResult = await resizeImage(
          file,
          maxWidth ? parseInt(maxWidth) : null,
          maxHeight ? parseInt(maxHeight) : null
        );

        setResizeInfo({
          original: { width: resizeResult.originalWidth, height: resizeResult.originalHeight, size: file.size },
          resized: { width: resizeResult.width, height: resizeResult.height, size: resizeResult.blob.size }
        });

        // Create a new File object from the blob
        fileToUpload = new File([resizeResult.blob], filename, { type: file.type });
      }

      const formData = new FormData();
      formData.append('image', fileToUpload);
      formData.append('repo', selectedRepo.full_name);
      formData.append('pageSlug', pageSlug);
      formData.append('customFilename', filename); // Send custom filename
      console.log('[ImageUploader] FormData prepared.', { fileName: filename, repo: selectedRepo.full_name, pageSlug });

      console.log('[ImageUploader] Initiating fetch to /api/image/upload...');
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
      });
      console.log('[ImageUploader] Fetch call completed.', { status: response.status, ok: response.ok });

      const result = await response.json();
      console.log('[ImageUploader] Response JSON parsed.', { result });

      if (!response.ok) {
        console.error('[ImageUploader] Response was not OK. Throwing error.');
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

      console.log('[ImageUploader] Upload successful. Setting status to "success".');
      setStatus('success');
      if (onComplete) {
        console.log('[ImageUploader] Calling onComplete callback with result.');
        onComplete({
          path: result.path,
          alt: altText,
          title: title,
          description: description,
          loading: loading
        });
      }
    } catch (err) {
      console.error('[ImageUploader] CATCH BLOCK: An error occurred during upload.', {
        errorMessage: err.message,
        errorStack: err.stack,
        error: err,
      });
      setStatus('error');
      setError(err.message);
    }
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <RefreshCw size={20} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={20} className="text-yellow-green" />;
      case 'error':
        return <AlertCircle size={20} className="text-scarlet" />;
      default:
        return <UploadCloud size={20} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div class="space-y-4">
      {/* File Upload Area */}
      <div
        class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif, image/webp"
          class="hidden"
        />
        {preview ? (
          <div class="space-y-2">
            <img src={preview} alt="Image preview" class="max-h-40 mx-auto rounded-md" />
            {file && (
              <p class="text-xs text-gray-400">
                {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>
        ) : (
          <div class="text-gray-400">
            <UploadCloud size={40} class="mx-auto mb-2" />
            <p>Click to browse or drag & drop</p>
            <p class="text-xs">PNG, JPG, GIF, WEBP</p>
          </div>
        )}
      </div>

      {/* SEO Score Indicator */}
      {file && (
        <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-300">SEO Score</span>
            <span class={`text-lg font-bold ${seoScore >= 80 ? 'text-green-400' : seoScore >= 50 ? 'text-yellow-400' : 'text-orange-400'}`}>
              {seoScore}/100
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class={`h-2 rounded-full transition-all ${seoScore >= 80 ? 'bg-green-400' : seoScore >= 50 ? 'bg-yellow-400' : 'bg-orange-400'}`}
              style={{ width: `${seoScore}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Alt Text (Required) */}
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
          Alt Text (Required)
          <Tooltip text="Describes the image for screen readers and SEO. Keep it descriptive but concise.">
            <HelpCircle size={14} class="text-gray-500 cursor-help" />
          </Tooltip>
        </label>
        <input
          type="text"
          placeholder="e.g., Beautiful sunset over mountains"
          value={altText}
          onInput={(e) => setAltText(e.target.value)}
          class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
          disabled={!file}
        />
        <div class="flex justify-between mt-1">
          <p class="text-xs text-gray-500">
            {altText.length > 0 && (altText.length < 10 ? '⚠️ Too short' : altText.length > 125 ? '⚠️ Too long' : '✓ Good length')}
          </p>
          <p class="text-xs text-gray-500">{altText.length}/125</p>
        </div>
      </div>

      {/* Filename */}
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
          Filename
          <Tooltip text="Auto-generated from alt text. Edit if needed. Extension is preserved automatically.">
            <HelpCircle size={14} class="text-gray-500 cursor-help" />
          </Tooltip>
        </label>
        <input
          type="text"
          placeholder="e.g., beautiful-sunset.jpg"
          value={filename}
          onInput={(e) => setFilename(e.target.value)}
          class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
          disabled={!file}
        />
        <p class="text-xs text-gray-500 mt-1">
          {filename.length > 60 && '⚠️ Filename is long. Consider shortening for better SEO.'}
        </p>
      </div>

      {/* Advanced Options Toggle */}
      {file && (
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          class="text-sm text-accent-lime hover:text-lime-400 transition-colors flex items-center gap-1"
        >
          {showAdvanced ? '▼' : '▶'} Advanced SEO & Resize Options
        </button>
      )}

      {/* Advanced Options */}
      {showAdvanced && file && (
        <div class="space-y-4 pl-4 border-l-2 border-gray-700">
          {/* Image Title */}
          <div>
            <label class="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              Image Title (Optional)
              <Tooltip text="Appears as tooltip on hover. Adds extra context for users and search engines.">
                <HelpCircle size={14} class="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <input
              type="text"
              placeholder="e.g., Sunset Photography"
              value={title}
              onInput={(e) => setTitle(e.target.value)}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
            />
          </div>

          {/* Description */}
          <div>
            <label class="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
              <Tooltip text="Additional context about the image. Useful for captions and detailed descriptions.">
                <HelpCircle size={14} class="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <textarea
              placeholder="e.g., A breathtaking view captured during golden hour..."
              value={description}
              onInput={(e) => setDescription(e.target.value)}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
              rows="2"
            />
          </div>

          {/* Loading Strategy */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Loading Strategy</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="loading"
                  value="lazy"
                  checked={loading === 'lazy'}
                  onChange={(e) => setLoading(e.target.value)}
                  class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
                />
                <span class="text-white text-sm">Lazy (Recommended) - Load when user scrolls near</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="loading"
                  value="eager"
                  checked={loading === 'eager'}
                  onChange={(e) => setLoading(e.target.value)}
                  class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
                />
                <span class="text-white text-sm">Eager - Load immediately (for hero images)</span>
              </label>
            </div>
          </div>

          {/* Resize Options */}
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Resize Image (Optional)
            </label>
            <div class="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mb-3">
              <div class="flex items-start gap-2">
                <Info size={16} class="text-blue-400 mt-0.5 flex-shrink-0" />
                <p class="text-xs text-blue-300">
                  Recommended: 1200px max width for hero images, 800px for content images. Aspect ratio is always preserved.
                </p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-400 mb-1 block">Max Width (px)</label>
                <input
                  type="number"
                  placeholder="e.g., 1200"
                  value={maxWidth}
                  onInput={(e) => setMaxWidth(e.target.value)}
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
              </div>
              <div>
                <label class="text-xs text-gray-400 mb-1 block">Max Height (px)</label>
                <input
                  type="number"
                  placeholder="e.g., 800"
                  value={maxHeight}
                  onInput={(e) => setMaxHeight(e.target.value)}
                  class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
                />
              </div>
            </div>
          </div>

          {/* Astro Optimization Note */}
          <div class="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <Info size={16} class="text-purple-400 mt-0.5 flex-shrink-0" />
              <p class="text-xs text-purple-300">
                Astro will automatically optimize this image for web delivery, including format conversion (WebP, AVIF) and responsive sizing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resize Info */}
      {resizeInfo && (
        <div class="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
          <p class="text-sm text-green-300 font-medium mb-1">✓ Image Resized</p>
          <p class="text-xs text-green-400">
            Original: {resizeInfo.original.width}×{resizeInfo.original.height} ({formatFileSize(resizeInfo.original.size)})
            → Resized: {resizeInfo.resized.width}×{resizeInfo.resized.height} ({formatFileSize(resizeInfo.resized.size)})
          </p>
          <p class="text-xs text-green-400 mt-1">
            Saved: {formatFileSize(resizeInfo.original.size - resizeInfo.resized.size)} ({Math.round((1 - resizeInfo.resized.size / resizeInfo.original.size) * 100)}% reduction)
          </p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || status === 'uploading' || !altText.trim()}
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
      >
        {renderStatusIcon()}
        {status === 'uploading' ? 'Uploading...' : 'Upload Image'}
      </button>

      {/* Error Message */}
      {status === 'error' && <p class="text-scarlet text-sm text-center">{error}</p>}

      {/* File Size Warning */}
      {file && file.size > 2 * 1024 * 1024 && !maxWidth && !maxHeight && (
        <div class="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <AlertCircle size={16} class="text-orange-400 mt-0.5 flex-shrink-0" />
            <p class="text-xs text-orange-300">
              Large file detected ({formatFileSize(file.size)}). Consider resizing to improve page speed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
