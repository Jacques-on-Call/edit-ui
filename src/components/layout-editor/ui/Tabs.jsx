import { useState, useMemo } from 'preact/hooks';

export default function Tabs({ tabs, initial = 0, onChange }) {
  const [active, setActive] = useState(initial);
  const activeTab = useMemo(() => tabs[active], [tabs, active]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-slate-700 bg-slate-800 sticky top-0 z-10">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            onClick={() => { setActive(i); onChange && onChange(t.key, i); }}
            className={[
              'px-3 py-2 text-sm',
              i === active ? 'text-white border-b-2 border-blue-500' : 'text-slate-300 hover:text-white'
            ].join(' ')}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab?.render ? activeTab.render() : null}
      </div>
    </div>
  );
}
