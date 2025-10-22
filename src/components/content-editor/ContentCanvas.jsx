import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function BlockWrapper({ block, selectedId, setSelectedId }) {
  const isSelected = block.id === selectedId;
  const borderStyle = isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db';

  return (
    <div
      onClick={() => setSelectedId(block.id)}
      style={{ border: borderStyle, padding: '1rem', margin: '0.5rem 0' }}
    >
      <h3>{block.type}</h3>
      {/* TODO: Render a preview of the block based on its props */}
    </div>
  );
}

export default function ContentCanvas({ contentTree, onContentChange, selectedId, setSelectedId }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = contentTree.findIndex((item) => item.id === active.id);
      const newIndex = contentTree.findIndex((item) => item.id === over.id);
      onContentChange(arrayMove(contentTree, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={contentTree.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="bg-white p-4 rounded-md shadow-md min-h-full">
          {contentTree.length > 0 ? (
            contentTree.map((block) => (
              <SortableItem key={block.id} id={block.id}>
                <BlockWrapper block={block} selectedId={selectedId} setSelectedId={setSelectedId} />
              </SortableItem>
            ))
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>Drop blocks here to start building your content.</p>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
