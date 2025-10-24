import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon';
import Tabs from './ui/Tabs';
import { compileAstro } from '../../lib/layouts/compileAstro';
import { validateAstroLayout } from '../../lib/layouts/validateAstro';
import HtmlAttrsEditor from './HtmlAttrsEditor';
import ImportsEditor from './ImportsEditor';
import PropsEditor from './PropsEditor';
import HeadEditor from './HeadEditor';
import RegionsEditor from './RegionsEditor';

const defaultBlueprint = {
  name: 'New Layout',
  htmlAttrs: { lang: 'en' },
  imports: [],
  props: {
    title: { type: 'string', default: 'Site Title' },
    description: { type: 'string', default: '' },
  },
  head: [
    { type: 'meta', attrs: { charset: 'utf-8' } },
    { type: 'meta', attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1' } },
    { type: 'title', contentFromProp: 'title' },
  ],
  preContent: [],
  contentSlot: { name: 'Content', single: true },
  postContent: [],
};

export default function LayoutModeEditor({ initialBlueprint, initialSha, filePath }) {
  const [bp, setBp] = useState(initialBlueprint || defaultBlueprint);
  const [dirty, setDirty] = useState(false);
  const repo = useMemo(() => localStorage.getItem('selectedRepo'), []);
  const branch = useMemo(() => localStorage.getItem('selectedBranch') || 'main', []);
  const filename = filePath?.split('/').pop();

  useEffect(() => { if (initialBlueprint) setBp(initialBlueprint); }, [initialBlueprint]);
  useEffect(() => {
    const onBeforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  function update(partKey, value) { setBp((prev) => { setDirty(true); return { ...prev, [partKey]: value }; }); }

  const compiled = useMemo(() => compileAstro(bp), [bp]);
  const validation = useMemo(() => validateAstroLayout(compiled), [compiled]);

  async function doSave(sha) {
    return fetch('/api/save-layout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo, path: filePath, content: compiled, branch, sha,
        message: `feat: update layout ${filePath} via Layout Mode`,
      }),
    });
  }

  async function handleSave() {
    if (!repo || !filePath) { alert('Missing repository or file path.'); return; }
    if (!validation.ok) { alert(`Validation failed:\n- ${validation.errors.join('\n- ')}`); return; }
    let res = await doSave(initialSha || undefined);
    if (res.status === 409) {
      const latest = await fetch(
        `/api/get-file-content?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(branch)}`,
        { credentials: 'include' }
      );
      if (latest.ok) {
        const { sha: newSha } = await latest.json();
        if (!window.confirm('The file changed upstream. Overwrite with your changes?')) return;
        res = await doSave(newSha);
      }
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || `Failed to save (status ${res.status}).`);
      return;
    }
    setDirty(false);
    alert('Saved!');
  }

  const LayoutTab = () => (
    <div className="p-4">
      <HtmlAttrsEditor value={bp.htmlAttrs || {}} onChange={(v) => update('htmlAttrs', v)} />
    </div>
  );

  const FrontmatterTab = () => (
    <div className="p-4 space-y-6">
      <ImportsEditor value={bp.imports || []} onChange={(v) => update('imports', v)} />
      <PropsEditor value={bp.props || {}} onChange={(v) => update('props', v)} />
    </div>
  );

  const HeadTab = () => (
    <div className="p-4">
      <HeadEditor value={bp.head || []} onChange={(v) => update('head', v)} />
    </div>
  );

  const BodyTab = () => (
    <div className="p-4 space-y-4">
      <RegionsEditor
        preContent={bp.preContent || []}
        postContent={bp.postContent || []}
        onPreChange={(v) => update('preContent', v)}
        onPostChange={(v) => update('postContent', v)}
      />
    </div>
  );

  const PreviewTab = () => (
    <div className="p-4 h-full overflow-auto">
      {!validation.ok && (
        <div className="mb-3 rounded bg-red-900/40 border border-red-800 text-red-200 p-3 text-sm">
          <div className="font-semibold mb-1">Validation errors</div>
          <ul className="list-disc pl-5">
            {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      <pre className="bg-slate-950 text-slate-200 p-3 rounded text-xs whitespace-pre-wrap">
        {compiled}
      </pre>
    </div>
  );

  const tabs = [
    { key: 'layout', label: 'Layout', render: LayoutTab },
    { key: 'frontmatter', label: 'Frontmatter', render: FrontmatterTab },
    { key: 'head', label: 'Head', render: HeadTab },
    { key: 'body', label: 'Body', render: BodyTab },
    { key: 'preview', label: 'Preview', render: PreviewTab },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800 shadow-md z-20">
        <Link to="/explorer" className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          <Icon name="Home" className="text-white" />
        </Link>
        <h1 className="font-semibold text-center truncate">{filename}</h1>
        <button onClick={handleSave} className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          <Icon name="UploadCloud" className="text-white" />
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} initial={0} />
        </div>
        <div className="w-[40%] min-w-[380px] max-w-[680px] border-l border-slate-800 bg-slate-950">
          <PreviewTab />
        </div>
      </div>
    </div>
  );
}
