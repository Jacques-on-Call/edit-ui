import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';

// Internal component to handle setting the initial editor state from HTML
function InitialContentPlugin({ initialContent }) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || !initialContent) {
      return;
    }
    hasInitialized.current = true;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      $getRoot().select();
      $insertNodes(nodes);
    });
  }, [editor, initialContent]);

  return null;
}

export default function LexicalEditor({ initialContent, onChange, slug }) {
  const isInitializedRef = useRef(false);

  const initialConfig = {
    namespace: 'EasySEO-Editor',
    theme: {
      // Basic theming for paragraphs to inherit color
      paragraph: 'editor-paragraph',
    },
    onError(error) {
      console.error(error);
    },
  };

  const handleOnChange = (editorState, editor) => {
    // Guard against the initial programmatic update triggering a change event
    if (!isInitializedRef.current && initialContent) {
      console.log("[ContentEditor] lexical-init suppressed-change-events");
      isInitializedRef.current = true;
      return;
    }

    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      // Pass the HTML string to the parent component's callback
      onChange(htmlString);
    });
  };

  useEffect(() => {
    // Log on mount as per requirements
    console.log(`[ContentEditor] Lexical mounted - slug: ${slug}`);
  }, [slug]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div class="relative bg-gray-900 text-white h-full">
        <RichTextPlugin
          contentEditable={<ContentEditable class="outline-none w-full h-full p-4" />}
          placeholder={<div class="absolute top-4 left-4 text-gray-500 pointer-events-none">Enter some text...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleOnChange} />
        {initialContent && <InitialContentPlugin initialContent={initialContent} />}
      </div>
    </LexicalComposer>
  );
}
