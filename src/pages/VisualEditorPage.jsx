import React, { useContext } from 'react';
import { EditorProvider, EditorContext } from '../contexts/EditorContext';

import LayoutEditor from '../components/LayoutEditor';
import SettingsPanel from '../components/SettingsPanel';

// Placeholder components - will be implemented in the next steps
const ComponentPalette = () => <div className="w-64 bg-gray-200 p-4">Component Palette Placeholder</div>;

const EditorUI = () => {
  const { loading, error } = useContext(EditorContext);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading Editor...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ComponentPalette />
      <main className="flex-1 flex flex-col bg-white">
        <LayoutEditor />
      </main>
      <SettingsPanel />
    </div>
  );
};

const VisualEditorPage = () => {
  return (
    <EditorProvider>
      <div className="flex flex-col h-screen font-sans antialiased">
        <header className="bg-gray-800 text-white p-3 flex items-center shadow-md z-10">
          <h1 className="text-lg font-semibold">Visual Editor</h1>
        </header>
        <EditorUI />
      </div>
    </EditorProvider>
  );
};

export default VisualEditorPage;
