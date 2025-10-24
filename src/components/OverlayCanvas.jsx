import React, { useState, useEffect } from 'react';

export default function OverlayCanvas({ previewIframe, onSelectBlock, onLongPressBlock, onDragBlock }) {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.channel === 'sc-preview' && event.data.type === 'blocks-update') {
        setBlocks(event.data.payload.blocks);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (previewIframe) {
      previewIframe.contentWindow.postMessage({
        channel: 'sc-preview',
        version: '1',
        type: 'scan-blocks',
      }, '*');
    }
  }, [previewIframe]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {blocks.map(block => (
        <div
          key={block.id}
          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-auto cursor-pointer"
          style={{
            top: block.rect.top,
            left: block.rect.left,
            width: block.rect.width,
            height: block.rect.height,
          }}
          onClick={() => onSelectBlock(block.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onLongPressBlock(e, block.id);
          }}
          // Drag and drop will be handled here
        />
      ))}
    </div>
  );
}
