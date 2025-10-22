import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import ContextMenu from './ContextMenu';
import { deleteBlock, duplicateBlock } from '../../lib/content/treeOps';

// A presentational component for displaying a block
function Block({ block, isSelected, isDragging, isOverlay, onContextMenu }) {
  const classes = [
    "p-4", "bg-white", "rounded-lg", "shadow-md", "transition-shadow", "relative",
    isSelected && !isOverlay ? "ring-2 ring-blue-600" : "ring-1 ring-gray-200",
    isDragging ? "opacity-50" : "",
    isOverlay ? "shadow-xl" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} onContextMenu={onContextMenu}>
      <h3 className="font-semibold text-gray-800">{block.type}</h3>
      {/* A preview of the block's content would go here */}
    </div>
  );
}

// A sortable wrapper for our block component
function SortableBlock({ block, selectedId, setSelectedId, onContextMenu }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease', // Add a default transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedId(block.id)}
      onContextMenu={(e) => onContextMenu(e, block.id)}
    >
      <Block block={block} isSelected={block.id === selectedId} isDragging={isDragging} />
    </div>
  );
}

// The main canvas component with enhanced DnD affordances
export default function ContentCanvas({ contentTree, onContentChange, selectedId, setSelectedId }) {
  const [activeId, setActiveId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = contentTree.findIndex((item) => item.id === active.id);
      const newIndex = contentTree.findIndex((item) => item.id === over.id);
      onContentChange(arrayMove(contentTree, oldIndex, newIndex));
    }

    setActiveId(null);
  };

  const handleContextMenu = (event, blockId) => {
    event.preventDefault();
    setSelectedId(blockId);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      blockId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const contextMenuItems = contextMenu ? [
    {
      label: 'Duplicate',
      action: () => onContentChange(duplicateBlock(contentTree, contextMenu.blockId)),
    },
    {
      label: 'Delete',
      isDestructive: true,
      action: () => onContentChange(deleteBlock(contentTree, contextMenu.blockId)),
    },
  ] : [];

  const activeBlock = activeId ? contentTree.find(item => item.id === activeId) : null;

  return (
    <div className="relative min-h-full" onClick={closeContextMenu}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext items={contentTree.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner min-h-full space-y-4">
            {contentTree.length > 0 ? (
              contentTree.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  onContextMenu={handleContextMenu}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p>Add blocks to get started.</p>
              </div>
            )}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeBlock ? (
            <Block block={activeBlock} isSelected={false} isDragging={false} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
