// easy-seo/src/components/BlockTree.jsx
import Icon from './Icon';

const BlockNode = ({ node, onSelect, selectedBlockId }) => {
  const isSelected = selectedBlockId === node.id;

  const handleSelect = () => {
    console.log(`[BlockTree] node clicked: ${node.id}`);
    onSelect(node.id);
  };

  return (
    <div className="ml-4 my-1">
      <div
        onClick={handleSelect}
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-500/30 border border-blue-400'
            : 'hover:bg-white/10 border border-transparent'
        }`}
        style={{ minHeight: '44px' }}
      >
        <Icon name="Box" className="w-5 h-5 text-gray-400" />
        <div className="flex-grow">
          <span className="font-semibold text-white">{node.type}</span>
          <p className="text-xs text-gray-400">ID: {node.id}</p>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="pl-4 border-l-2 border-gray-700">
          {node.children.map(child => (
            <BlockNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedBlockId={selectedBlockId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BlockTree = ({ blocks, onSelectBlock, selectedBlockId }) => {
  if (!blocks || blocks.length === 0) {
    return <div className="p-4 text-gray-500">No blocks defined for this page.</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2 text-gray-300">Block Tree</h3>
      {blocks.map(node => (
        <BlockNode
          key={node.id}
          node={node}
          onSelect={onSelectBlock}
          selectedBlockId={selectedBlockId}
        />
      ))}
    </div>
  );
};

export default BlockTree;
