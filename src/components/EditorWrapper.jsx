import React, { useRef } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import styles from './EditorWrapper.module.css';

const EditorWrapper = () => {
  const editorRef = useRef(null);

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorWrapper}>
        <TinyMCEEditor
          onInit={(evt, editor) => (editorRef.current = editor)}
          initialValue="<p>This is the initial content of the editor.</p>"
          init={{
            height: 500,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </div>
    </div>
  );
};

export default EditorWrapper;