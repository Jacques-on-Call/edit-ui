import React, { useRef, useEffect } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

const SectionEditor = ({ section, onSectionChange }) => {
  const editorRef = useRef(null);

  // This effect ensures that the editor's content is synchronized with the parent's state.
  // It manually sets the content if the prop changes, which is necessary for
  // rich text editors that maintain their own internal state.
  useEffect(() => {
    if (editorRef.current && editorRef.current.getContent() !== section.content) {
      editorRef.current.setContent(section.content || '');
    }
  }, [section.content]);

  // Handles changes from simple <input> fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedSection = { ...section, [name]: value };
    onSectionChange(updatedSection);
  };

  // Handles changes from a TinyMCE editor instance
  const handleEditorChange = (content, editor) => {
    const updatedSection = { ...section, content: content };
    onSectionChange(updatedSection);
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
              height: 250,
              menubar: false,
              plugins: 'lists link image code table placeholder',
              toolbar: 'undo redo | formatselect | bold italic | bullist numlist | link image | code',
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
