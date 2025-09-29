import React from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

// Import the self-hosted TinyMCE assets.
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


const SectionEditor = ({ initialContent, onContentChange, onInit, onNodeChange, placeholder }) => {

  return (
    <TinyMCEEditor
        onInit={onInit}
        initialValue={initialContent}
        onEditorChange={onContentChange}
        init={{
            height: "100%",
            readonly: false,
            promotion: false,
            setup: (editor) => {
                editor.on('NodeChange', () => onNodeChange(editor));
            },
            menubar: false,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: false, // The custom toolbar is in `TopToolbar.jsx`

            /*
             * This content_style is crucial for the "Google Docs" or "frameless page" look.
             * It styles the body *inside* the editor's iframe.
             * The surrounding gray area is provided by the parent component's CSS.
             */
            content_style: `
                body {
                    background-color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #1d1d1f;
                    max-width: 820px;
                    margin: 0 auto;
                    padding: 2.5rem;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
                    border-radius: 3px;
                }
            `,
            placeholder: placeholder || 'Start writing your content here...',
            license_key: 'gpl',
            skin: false,
            content_css: false
        }}
    />
  );
};

export default SectionEditor;