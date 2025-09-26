import React from 'react';
import Icon from './icons';
import './TopToolbar.css';

const TopToolbar = ({ onDone, onPublish, isSaving }) => {
  return (
    <div className="top-toolbar">
      <div className="toolbar-group left">
        <button onClick={onDone} title="Back to Preview" className="toolbar-button">
          <Icon name="eye" />
          <span>Preview</span>
        </button>
      </div>
      <div className="toolbar-group right">
        <button
          onClick={onPublish}
          disabled={isSaving}
          className="toolbar-button publish-button"
        >
          {isSaving ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default TopToolbar;