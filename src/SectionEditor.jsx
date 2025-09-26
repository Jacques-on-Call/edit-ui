import React from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

// Import the self-hosted TinyMCE assets.
// This is crucial for making the editor work offline and avoiding CDN issues.
import 'tinymce/tinymce';
import 'tinymce/skins/ui/oxide/skin.css';
import 'tinymce/skins/content/default/content.css';
import 'tinymce/icons/default/icons';
import 'tinymce/themes/silver/theme';
import 'tinymce/models/dom/model';
// Import all the plugins you need
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/help';
import 'tinymce/plugins/wordcount';


const SectionEditor = ({ initialContent, onContentChange, onInit, onNodeChange }) => {

  return (
    <TinyMCEEditor
        onInit={onInit}
        initialValue={initialContent}
        onEditorChange={onContentChange}
        init={{
            height: "100%",
            readonly: false, // Explicitly set to false to fix the read-only bug
            promotion: false, // Remove the "Upgrade" nag
            setup: (editor) => {
                editor.on('NodeChange', () => onNodeChange(editor));
            },
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
            skin: false, // Required for self-hosted skins
            content_css: false // Required for self-hosted content CSS
        }}
    />
  );
};

export default SectionEditor;
