import React from 'react';
import LayoutModeEditor from './LayoutModeEditor';

const EditorRouter = ({ initialBlueprint, initialState, filePath, fileSha, hasMarkers }) => {
  if (hasMarkers) {
    return <LayoutModeEditor initialBlueprint={initialBlueprint} filePath={filePath} fileSha={fileSha} />;
  } else {
    // Fallback to LayoutModeEditor for now, as ContentModeEditor is out of scope.
    return <LayoutModeEditor initialBlueprint={initialBlueprint} filePath={filePath} fileSha={fileSha} />;
  }
};

export default EditorRouter;
