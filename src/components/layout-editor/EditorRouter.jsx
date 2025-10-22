import React from 'react';
import LayoutModeEditor from './LayoutModeEditor';
import ContentModeEditor from '../content-editor/ContentModeEditor';

const EditorRouter = ({ initialBlueprint, initialState, filePath, fileSha, hasMarkers }) => {
  if (hasMarkers) {
    return <LayoutModeEditor initialBlueprint={initialBlueprint} filePath={filePath} fileSha={fileSha} />;
  } else {
    // When no markers are present, we load the Content Mode Editor.
    // The `initialState` from the old editor corresponds to the `initialContent` of the new one.
    return <ContentModeEditor initialContent={initialState} initialSha={fileSha} />;
  }
};

export default EditorRouter;
