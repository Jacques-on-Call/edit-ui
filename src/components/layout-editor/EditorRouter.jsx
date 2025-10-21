import React from 'react';
import LayoutModeEditor from './LayoutModeEditor';
import LayoutEditor from './LayoutEditor';

const EditorRouter = ({ initialBlueprint, initialState, filePath, fileSha, hasMarkers }) => {
  if (hasMarkers) {
    return <LayoutModeEditor initialBlueprint={initialBlueprint} filePath={filePath} fileSha={fileSha} />;
  } else {
    // For now, we'll assume that if there are no markers, it's a block-based layout.
    // This can be refined later if needed.
    return <LayoutEditor initialState={initialState} filePath={filePath} fileSha={fileSha} />;
  }
};

export default EditorRouter;
