import { h } from 'preact';
import { useState } from 'preact/hooks';
import { X } from 'lucide-preact';
import ImageUploader from './ImageUploader';

const RadioButton = ({ name, value, label, checked, onChange }) => (
    <label class="flex items-center space-x-2 cursor-pointer">
        <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            class="form-radio bg-gray-800 border-gray-600 text-accent-lime focus:ring-accent-lime"
        />
        <span class="text-white text-sm">{label}</span>
    </label>
);

export default function ImageInsertModal({ isOpen, onClose, pageSlug, onInsert }) {
  const [uploadData, setUploadData] = useState(null);
  const [alignment, setAlignment] = useState('center');
  const [width, setWidth] = useState('100%');

  const handleUploadComplete = (data) => {
    setUploadData(data);
  };

  const handleInsert = () => {
    if (uploadData) {
      onInsert({
        ...uploadData,
        alignment,
        width,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setUploadData(null);
    setAlignment('center');
    setWidth('100%');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in-fast overflow-y-auto py-4">
      <div class="bg-gradient-to-b from-gray-900 to-black border border-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4 my-auto max-h-[90vh] flex flex-col">
        <header class="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <h2 class="text-xl font-bold text-white flex-grow">
            {uploadData ? 'Set Image Styles' : 'Insert Image'}
          </h2>
          <button onClick={handleClose} class="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <X size={24} />
          </button>
        </header>
        <div class="p-6 overflow-y-auto flex-1">
          {!uploadData ? (
            <ImageUploader pageSlug={pageSlug} onComplete={handleUploadComplete} />
          ) : (
            <div class="space-y-6">
                <div>
                    <img src={uploadData.path} alt={uploadData.alt} class="max-h-40 mx-auto rounded-md border border-gray-700" />
                    <p class="text-center text-xs text-gray-400 mt-2 truncate">{uploadData.path}</p>
                </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Alignment</label>
                <div class="flex items-center space-x-4">
                  <RadioButton name="alignment" value="left" label="Left" checked={alignment === 'left'} onChange={(e) => setAlignment(e.target.value)} />
                  <RadioButton name="alignment" value="center" label="Center" checked={alignment === 'center'} onChange={(e) => setAlignment(e.target.value)} />
                  <RadioButton name="alignment" value="right" label="Right" checked={alignment === 'right'} onChange={(e) => setAlignment(e.target.value)} />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Width</label>
                 <div class="flex items-center space-x-4">
                  <RadioButton name="width" value="25%" label="25%" checked={width === '25%'} onChange={(e) => setWidth(e.target.value)} />
                  <RadioButton name="width" value="50%" label="50%" checked={width === '50%'} onChange={(e) => setWidth(e.target.value)} />
                  <RadioButton name="width" value="75%" label="75%" checked={width === '75%'} onChange={(e) => setWidth(e.target.value)} />
                  <RadioButton name="width" value="100%" label="100%" checked={width === '100%'} onChange={(e) => setWidth(e.target.value)} />
                </div>
              </div>
               <div class="mt-6 flex justify-end">
                    <button onClick={handleInsert} class="bg-yellow-green text-black font-bold px-6 py-2 rounded-lg hover:bg-lime-400 transition-colors">
                        Insert Image
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
