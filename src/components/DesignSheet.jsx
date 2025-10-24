import React from 'react';

export default function DesignSheet({ visible, values, onChange, onClose }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Design</h3>
          <button className="px-3 py-1 rounded bg-gray-900 text-white" onClick={onClose}>Done</button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <div className="mb-1 text-sm">Background Color</div>
            <input type="color" value={values.background || '#ffffff'} onChange={e => onChange('theme.background', e.target.value)} />
          </label>

          <div>
            <div className="mb-1 text-sm">Typography</div>
            <div className="flex gap-2">
              {['S','M','L'].map(s => (
                <button key={s}
                  className={`px-3 py-2 rounded border ${values.typographyScale === s ? 'bg-gray-900 text-white' : 'bg-white'}`}
                  onClick={() => onChange('theme.typographyScale', s)}
                >{s}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm">Spacing</div>
            <div className="flex gap-2">
              {['Tight','Comfort','Spacious'].map(preset => (
                <button key={preset}
                  className="px-3 py-2 rounded border"
                  onClick={() => onChange('theme.spacingPreset', preset)}
                >{preset}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
