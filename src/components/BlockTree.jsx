// easy-seo/src/components/BlockTree.jsx
import { h } from 'preact';

const BlockTree = ({ blocks, onSelectBlock }) => {
  const handleClick = (id) => {
    console.log(`[BlockTree] node clicked: ${id}`);
    if (onSelectBlock) {
      onSelectBlock(id);
    }
  };

  return (
    <div class="p-2">
      <h3 class="font-bold mb-2">Block Tree</h3>
      <ul>
        {(blocks || []).map(block => (
          <li
            key={block.id}
            onClick={() => handleClick(block.id)}
            class="cursor-pointer hover:bg-gray-700 p-1 rounded"
          >
            {block.type}: {block.content.substring(0, 20)}...
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlockTree;
