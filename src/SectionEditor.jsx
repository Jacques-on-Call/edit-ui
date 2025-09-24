import React from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

const SectionEditor = ({ initialContent, onContentChange, onInit }) => {

  return (
    <TinyMCEEditor
        onInit={onInit}
        initialValue={initialContent}
        onEditorChange={onContentChange}
        init={{
            height: "100%",
            menubar: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: false, // Disable the default toolbar, we will build a custom one

            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size:16px; padding: 2rem; }',
            placeholder: 'Start writing your content here...',
            license_key: 'gpl',
            skin_url: '/tinymce/skins/ui/oxide',
            content_css: '/tinymce/skins/content/default/content.css'
        }}
    />
  );
};

export default SectionEditor;
