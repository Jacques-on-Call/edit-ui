import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Hero } from './Hero';
import { HeroSettings } from './HeroSettings';

export const EditorHero = (props) => {
  const {
    connectors: { connect, drag },
    id
  } = useNode();

  const { actions, query } = useEditor();
  const [showMobileControls, setShowMobileControls] = React.useState(false);

  const handleMoveUp = () => {
    const parent = query.node(id).get().data.parent;
    const parentChildren = query.node(parent).get().data.nodes;
    const index = parentChildren.indexOf(id);
    if (index > 0) {
      actions.move(id, parent, index - 1);
    }
  };

  const handleMoveDown = () => {
    const parent = query.node(id).get().data.parent;
    const parentChildren = query.node(parent).get().data.nodes;
    const index = parentChildren.indexOf(id);
    if (index < parentChildren.length - 1) {
      actions.move(id, parent, index + 1);
    }
  };

  const handleDelete = () => {
    actions.delete(id);
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      onClick={() => setShowMobileControls(!showMobileControls)}
      className="relative"
    >
      <Hero {...props} />

      {/* Mobile controls - only show on touch devices */}
      {showMobileControls && (
        <div className="absolute top-2 right-2 flex gap-2 bg-white rounded-lg shadow-lg p-2 z-50">
          <button onClick={handleMoveUp} className="px-3 py-1 bg-blue-500 text-white rounded">
            ↑
          </button>
          <button onClick={handleMoveDown} className="px-3 py-1 bg-blue-500 text-white rounded">
            ↓
          </button>
          <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded">
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

EditorHero.craft = {
  displayName: 'Hero',
  props: {
    title: 'This is the Hero Title',
    subtitle: 'This is the hero subtitle. Click here to edit.',
    style: {
      paddingTop: '80px',
      paddingBottom: '80px',
      backgroundColor: '#f7fafc',
    },
  },
  related: {
    settings: HeroSettings,
  },
};