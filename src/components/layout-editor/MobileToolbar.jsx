import React from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

const MobileToolbar = ({
  selectedId,
  onMove,
  onDelete,
  onOpenToolbox,
  canMoveUp,
  canMoveDown,
}) => {
  if (!selectedId) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center">
        <button
          onClick={onOpenToolbox}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Component
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex items-center justify-center gap-2">
      <button
        onClick={() => onMove('up')}
        disabled={!canMoveUp}
        className="p-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Move component up"
      >
        <ArrowUp className="w-6 h-6" />
      </button>
      <button
        onClick={() => onMove('down')}
        disabled={!canMoveDown}
        className="p-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Move component down"
      >
        <ArrowDown className="w-6 h-6" />
      </button>
      <button
        onClick={onDelete}
        className="p-3 border rounded-lg text-red-500"
      >
        <Trash2 className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MobileToolbar;