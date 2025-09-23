import React, { useRef, useEffect } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

const SectionEditor = ({ section, onSectionChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.initialized) {
      const currentContent = editor.getContent();
      if (currentContent !== section.content) {
        editor.setContent(section.content || '');
      }
    }
  }, [section.content]);

  const handleEditorChange = (content) => {
    if (content !== section.content) {
      onSectionChange({ ...section, content: content });
    }
  };

  // This component now only renders the TinyMCE editor.
  // All other fields have been moved to the HeadEditor.
  if (!Object.prototype.hasOwnProperty.call(section, 'content')) {
    return null;
  }

  return (
    <div className="section-editor-container">
        <TinyMCEEditor
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={section.content || ''}
            onEditorChange={handleEditorChange}
            init={{
                height: "100%",
                menubar: false,
                inline: false, // Using iframe editor for better style isolation
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'quickbars'
                ],
                // Top toolbar configuration
                toolbar: 'undo redo | ' +
                         'blocks | ' + // Heading styles
                         'bold italic underline strikethrough | ' +
                         'forecolor backcolor | ' +
                         'alignleft aligncenter alignright alignjustify | ' +
                         'bullist numlist outdent indent | ' +
                         'link image media table | ' +
                         'removeformat | help',

                // Contextual toolbar for text selection
                quickbars_selection_toolbar: 'bold italic | forecolor | link | quicktable',

                // Simulates the bottom bar for quick actions
                quickbars_insert_toolbar: 'image table media | hr pagebreak',

                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size:16px }',
                placeholder: 'Start writing your content here...',
                license_key: 'gpl',
                skin_url: '/tinymce/skins/ui/oxide',
                content_css: '/tinymce/skins/content/default/content.css'
            }}
        />
    </div>
  );
};

export default SectionEditor;
