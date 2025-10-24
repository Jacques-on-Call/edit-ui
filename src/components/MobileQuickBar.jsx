import React from 'react';

export default function MobileQuickBar({ onSave, onRebuild, rebuildDisabled, rebuildCountdown, onAdd, onDesign }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 flex items-center gap-2">
      <button className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold" onClick={onSave}>Save</button>
      <button className="flex-1 py-3 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-50" onClick={onRebuild} disabled={rebuildDisabled}>
        {rebuildDisabled && rebuildCountdown > 0 ? `Rebuild (${rebuildCountdown}s)` : 'Rebuild'}
      </button>
      <button className="w-12 h-12 rounded-full bg-gray-200" aria-label="Add block" onClick={onAdd}>＋</button>
      <button className="w-12 h-12 rounded-full bg-gray-200" aria-label="Design" onClick={onDesign}>🎨</button>
    </div>
  );
}
