import React from 'react';
import { BLOCKS } from '../../blocks/registry';
import { insertBlock } from '../../lib/content/treeOps';

export default function BlockPalette({ onContentChange, contentTree, selectedId, onBlockSelect }) {
  const handleBlockClick = (blockDef) => {
    const newContentTree = insertBlock(contentTree, blockDef, selectedId);
    if (newContentTree) {
      onContentChange(newContentTree);
      if (onBlockSelect) onBlockSelect(); // Close the toolbox after selection
    } else {
      // TODO: Show a user-friendly error message
      console.warn('Invalid block placement');
    }
  };

  const categorizedBlocks = BLOCKS.reduce((acc, block) => {
    const category = block.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {});

  return (
    <div className="p-4 grid grid-cols-4 gap-4">
      {Object.entries(categorizedBlocks).map(([category, blocks]) => (
        <div key={category}>
          <h4 className="font-bold mb-2 text-gray-700">{category}</h4>
          <div className="grid grid-cols-2 gap-2">
            {blocks.map((block) => (
              <button
                key={block.name}
                onClick={() => handleBlockClick(block)}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-center flex flex-col items-center justify-center"
              >
                <span>{block.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
