import React, { useState } from 'react';
import { compileBlocksToAstro } from '../../lib/content/compileBlocksToAstro';

export default function TopToolbar({ contentTree, isDirty, setIsDirty, currentSha, setCurrentSha }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const path = new URLSearchParams(window.location.search).get('path');
    const repo = localStorage.getItem('selectedRepo');
    const branch = localStorage.getItem('selectedBranch') || 'main';

    if (!path || !repo) {
      alert("Error: Missing file path or repository in session.");
      setIsSaving(false);
      return;
    }

    const contentBlueprint = {
      root: {
        type: 'root',
        children: contentTree,
      },
    };

    const astroString = compileBlocksToAstro(contentBlueprint);
    console.log("Compiled Astro:", astroString); // For debugging during Phase 1

    try {
      const response = await fetch('/api/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          path,
          content: astroString,
          sha: currentSha,
          branch,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsDirty(false);
        setCurrentSha(result.sha);
        alert('File saved successfully!');
      } else if (response.status === 409) {
        const userConfirmed = confirm(
          'The file has been modified on the server. Do you want to overwrite the remote changes?'
        );
        if (userConfirmed) {
          const refetchResponse = await fetch(`/api/get-file-content?repo=${repo}&path=${path}&ref=${branch}`);
          if (refetchResponse.ok) {
            const { sha: newSha } = await refetchResponse.json();
            setCurrentSha(newSha);
            alert('The latest version has been loaded. Please click Save again to overwrite.');
          } else {
             alert('Failed to fetch the latest version of the file.');
          }
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to save file: ${errorText}`);
      }
    } catch (err) {
      setError(err.message);
      alert(`An error occurred: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-2 flex justify-between items-center border-b">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">Content Editor</h2>
        {isDirty && <span className="text-sm text-yellow-600">(Unsaved Changes)</span>}
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50" disabled>
          Undo
        </button>
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50" disabled>
          Redo
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
