import React from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

const SectionEditor = ({ initialContent, onContentChange, onInit, onNodeChange }) => {
  const draftKey = `draft-content-${location.pathname.replace('/edit/', '')}`;

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
            toolbar: false, // We use a custom toolbar
            image_toolbar: 'imageoptions | setaspreview', // Add our custom button to the image toolbar

            setup: (editor) => {
                editor.on('NodeChange', () => onNodeChange(editor));

                editor.ui.registry.addButton('setaspreview', {
                  text: 'Set as Search Preview Image',
                  icon: 'image',
                  onAction: () => {
                    const node = editor.selection.getNode();
                    if (node.nodeName === 'IMG') {
                      const src = node.getAttribute('src');
                      const alt = node.getAttribute('alt');

                      // Update the draft in localStorage directly
                      try {
                        const draftString = localStorage.getItem(draftKey);
                        if (draftString) {
                          const draftData = JSON.parse(draftString);
                          draftData.frontmatter.image = src;
                          draftData.frontmatter.imageAlt = alt;
                          localStorage.setItem(draftKey, JSON.stringify(draftData));
                          editor.notificationManager.open({
                            text: 'Search preview image updated.',
                            type: 'success',
                            timeout: 3000
                          });
                        }
                      } catch (e) {
                        console.error('Failed to update draft with preview image', e);
                        editor.notificationManager.open({
                            text: 'Error updating preview image.',
                            type: 'error',
                            timeout: 3000
                          });
                      }
                    }
                  }
                });
            },
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