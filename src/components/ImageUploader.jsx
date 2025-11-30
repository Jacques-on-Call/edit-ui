import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { UploadCloud, RefreshCw, CheckCircle, AlertCircle } from 'lucide-preact';

export default function ImageUploader({ pageSlug, onComplete }) {
  const { selectedRepo } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [altText, setAltText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
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
    }
  };

  const handleUpload = async () => {
    console.log('[ImageUploader] handleUpload triggered.');
    if (!file || !selectedRepo) {
      console.error('[ImageUploader] Pre-flight check failed. File or repo missing.', { hasFile: !!file, hasRepo: !!selectedRepo });
      setError('Please select a file and ensure a repository is selected.');
      return;
    }

    console.log('[ImageUploader] Setting status to "uploading".');
    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('repo', selectedRepo.full_name);
    formData.append('pageSlug', pageSlug);
    console.log('[ImageUploader] FormData prepared.', { fileName: file.name, repo: selectedRepo.full_name, pageSlug });

    try {
      console.log('[ImageUploader] Initiating fetch to /api/image/upload...');
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header; browser does it for FormData
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
        onComplete({ path: result.path, alt: altText });
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

  return (
    <div class="space-y-4">
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
          <img src={preview} alt="Image preview" class="max-h-40 mx-auto rounded-md" />
        ) : (
          <div class="text-gray-400">
            <UploadCloud size={40} class="mx-auto mb-2" />
            <p>Click to browse or drag & drop</p>
            <p class="text-xs">PNG, JPG, GIF, WEBP</p>
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Enter Alt Text (for SEO & accessibility)"
        value={altText}
        onInput={(e) => setAltText(e.target.value)}
        class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-lime"
        disabled={!file}
      />

      <button
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
      >
        {renderStatusIcon()}
        {status === 'uploading' ? 'Uploading...' : 'Upload Image'}
      </button>

      {status === 'error' && <p class="text-scarlet text-sm text-center">{error}</p>}
    </div>
  );
}
