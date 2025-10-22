import React from 'react';

const RegionsEditor = ({ preContent, postContent, onPreChange, onPostChange }) => {
  // We assume raw html editing for now, as per the plan.
  // A more advanced component could handle a list of BodyNodes.
  const preContentText = preContent.map(n => n.html || '').join('\\n');
  const postContentText = postContent.map(n => n.html || '').join('\\n');

  const handlePreChange = (e) => {
    onPreChange([{ type: 'raw', html: e.target.value }]);
  };

  const handlePostChange = (e) => {
    onPostChange([{ type: 'raw', html: e.target.value }]);
  };

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium text-slate-400 mb-2">Pre-Content Region (Before Slot)</h3>
        <textarea
          value={preContentText}
          onChange={handlePreChange}
          className="w-full h-24 bg-slate-900 border border-slate-600 rounded-md p-2 text-sm font-mono"
          placeholder="e.g. <Header />"
        />
      </div>
      <div className="text-center my-4 p-4 border border-dashed border-slate-600 rounded-md">
        <p className="text-slate-400 font-medium">&lt;slot /&gt;</p>
        <p className="text-xs text-slate-500">Content from pages will be injected here.</p>
      </div>
      <div>
        <h3 className="text-lg font-medium text-slate-400 mb-2">Post-Content Region (After Slot)</h3>
        <textarea
          value={postContentText}
          onChange={handlePostChange}
          className="w-full h-24 bg-slate-900 border border-slate-600 rounded-md p-2 text-sm font-mono"
          placeholder="e.g. <Footer />"
        />
      </div>
    </div>
  );
};

export default RegionsEditor;
