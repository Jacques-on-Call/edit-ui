import React, { useRef, useEffect } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

const SectionEditor = ({ section, onSectionChange }) => {
  const editorRef = useRef(null);

  // This effect synchronizes the editor's content with the parent's state.
  // It only sets the content if the editor is initialized and the content
  // has actually changed, preventing unnecessary re-renders and cursor jumps.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.initialized) {
      const currentContent = editor.getContent();
      if (currentContent !== section.content) {
        editor.setContent(section.content || '');
      }
    }
  }, [section.content]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onSectionChange({ ...section, [name]: value });
  };

  const handleEditorChange = (content, editor) => {
    // We only call the onSectionChange callback if the content has
    // actually changed from the prop to prevent infinite loops.
    if (content !== section.content) {
      onSectionChange({ ...section, content: content });
    }
  };

  const renderEditor = () => {
    if (section.hasOwnProperty('content')) {
      return (
        <div className="form-group">
          <label>Content:</label>
          <TinyMCEEditor
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={section.content || ''}
            onEditorChange={handleEditorChange}
            init={{
              height: 550,
              menubar: false,
              plugins: 'lists link image code table placeholder',
              toolbar: window.innerWidth < 600
                ? 'undo redo | bold italic | bullist numlist'
                : 'undo redo | formatselect | bold italic | bullist numlist | link image | code',
              license_key: 'gpl',
              skin_url: '/tinymce/skins/ui/oxide',
              content_css: '/tinymce/skins/content/default/content.css',
              placeholder: 'Start writing your content here...',
            }}
          />
        </div>
      );
    }
    return null;
  };

  const renderFields = () => {
    return Object.keys(section).map(key => {
      if (key === 'type' || key === 'content') return null;
      return (
        <div className="form-group" key={key}>
          <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
          <input
            type="text"
            name={key}
            value={section[key] || ''}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
      );
    });
  };

  return (
    <div className="section-editor-container">
      <h4 className="section-type-header">{section.type}</h4>
      <div className="section-fields">
        {renderFields()}
        {renderEditor()}
      </div>
    </div>
  );
};

export default SectionEditor;
