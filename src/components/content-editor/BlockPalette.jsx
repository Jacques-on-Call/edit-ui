import React from 'react';
import { BLOCKS } from '../../blocks/registry';
import { insertBlock } from '../../lib/content/treeOps';

export default function BlockPalette({ onContentChange, contentTree, selectedId }) {
  const handleBlockClick = (blockDef) => {
    const newContentTree = insertBlock(contentTree, blockDef, selectedId);
    if (newContentTree) {
      onContentChange(newContentTree);
    } else {
      // TODO: Show a user-friendly error message
      console.warn('Invalid block placement');
    }
  };

  return (
    <div className="p-2">
      <h3 className="text-lg font-semibold mb-2">Blocks</h3>
      <div className="grid grid-cols-3 gap-2">
        {BLOCKS.map((block) => (
          <button
            key={block.name}
            onClick={() => handleBlockClick(block)}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm text-center"
          >
            {block.name}
          </button>
        ))}
      </div>
    </div>
  );
}
