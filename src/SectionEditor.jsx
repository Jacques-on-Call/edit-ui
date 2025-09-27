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

            // Remove default body margin for an edge-to-edge feel on mobile.
            // Add a little padding so text isn't flush with the screen edge.
            content_style: 'body { font-size:16px; margin: 0; padding: 0 1rem; }',
            placeholder: placeholder || 'Start writing your content here...',
            license_key: 'gpl',
            skin: false,
            content_css: false
        }}
    />
  );
};

export default SectionEditor;