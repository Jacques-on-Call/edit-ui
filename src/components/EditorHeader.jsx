// easy-seo/src/components/EditorHeader.jsx
import { h } from 'preact';

const EditorHeader = ({ children }) => {
  return (
    <div class="p-2 bg-gray-800 border-b border-gray-700 flex items-center" style={{ height: 'var(--header-h, 56px)' }}>
      {children}
    </div>
  );
};

export default EditorHeader;
