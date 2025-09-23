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
    <TinyMCEEditor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={section.content || ''}
        onEditorChange={handleEditorChange}
        init={{
            height: "100%",
            menubar: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            // Render the main toolbar in the parent component's header div
            fixed_toolbar_container: '.editor-header',
            toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image | removeformat',

            // Use a custom bottom toolbar in the footer
            // This is a bit of a hack, we can create a second editor instance
            // But for now, let's stick to the main toolbar.
            // A better solution would be to create a custom component.
            // For now, we will omit the bottom bar to ensure stability.

            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size:16px; padding: 1rem; }',
            placeholder: 'Start writing your content here...',
            license_key: 'gpl',
            skin_url: '/tinymce/skins/ui/oxide',
            content_css: '/tinymce/skins/content/default/content.css'
        }}
    />
  );
};

export default SectionEditor;
