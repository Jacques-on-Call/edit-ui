import React from 'react';
import BlockPalette from './BlockPalette';

export default function BottomToolbox({ isOpen, onClose, onContentChange, contentTree, selectedId }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-1/2 bg-white border-t border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out"
      style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="p-4 h-full overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-lg font-bold">
          &times;
        </button>
        <h3 className="text-xl font-semibold mb-4 text-center">Add a Block</h3>
        <BlockPalette
          onContentChange={onContentChange}
          contentTree={contentTree}
          selectedId={selectedId}
          onBlockSelect={onClose} // Close toolbox on block selection
        />
      </div>
    </div>
  );
}
