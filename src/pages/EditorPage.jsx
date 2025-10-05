import { useState, useEffect, useCallback } from ‘react’;
import { useSearchParams } from ‘react-router-dom’;
import { Editor } from ‘@tinymce/tinymce-react’;
import { debounce } from ‘lodash’;
import matter from ‘gray-matter’;
import TopToolbar from ‘../components/TopToolbar’;
import BottomToolbar from ‘../components/BottomToolbar’;
import { unifiedParser } from ‘../utils/unifiedParser’;
import { stringifyAstroFile } from ‘../utils/astroFileParser’;
import { sectionsToEditableHTML, editableHTMLToSections } from ‘../utils/sectionContentMapper’;

const ErrorDisplay = ({ error, rawContent }) => (

  <div className="p-4 sm:p-6 lg:p-8 bg-red-50">
    <h1 className="text-2xl font-bold text-red-700 mb-4">File Parsing Error</h1>
    <p className="text-red-600 mb-2">The editor could not parse the file content due to the following error. This usually means there is a syntax error (like a missing comma or unclosed quote) in the frontmatter.</p>
    <pre className="bg-white p-4 rounded-lg border border-red-200 text-red-800 whitespace-pre-wrap font-mono text-sm">
      <code>{error}</code>
    </pre>
    <p className="mt-4 text-gray-700 font-semibold">Problematic File Content:</p>
    <p className="text-gray-600 mb-2">The full, raw content of the file is shown below. You can copy this content, correct the error in your local code editor, and then commit the fix.</p>
    <textarea
      className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
      readOnly
      defaultValue={rawContent}
    />
  </div>
);

function EditorPage() {
const [searchParams] = useSearchParams();
const filePath = searchParams.get(‘path’);
const repo = localStorage.getItem(‘selectedRepo’);

const [frontmatter, setFrontmatter] = useState({});
const [content, setContent] = useState(null);
const [originalBody, setOriginalBody] = useState(’’);
const [originalSections, setOriginalSections] = useState([]);
const [fileType, setFileType] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [parsingError, setParsingError] = useState(null);
const [rawContentOnError, setRawContentOnError] = useState(’’);

const draftKey = `draft_${repo}_${filePath}`;

const saveDraft = useCallback(
debounce((htmlContent, currentFrontmatter, currentOriginalBody, currentOriginalSections) => {
// Convert edited HTML back to sections array
const updatedSections = editableHTMLToSections(htmlContent, currentOriginalSections);

```
  // Update frontmatter with new sections
  const updatedFrontmatter = { ...currentFrontmatter, sections: updatedSections };
  
  // Stringify the complete file
  const fullContent = stringifyAstroFile(updatedFrontmatter, currentOriginalBody);
  
  localStorage.setItem(draftKey, fullContent);
  console.log(`Draft saved for ${filePath}.`);
}, 1000),
[draftKey, filePath]
```

);

useEffect(() => {
const fetchAndParseContent = async () => {
if (!filePath || !repo) {
setError(‘Missing file path or repository information.’);
setLoading(false);
return;
}

```
  setLoading(true);
  setParsingError(null);
  setRawContentOnError('');

  try {
    let fileContent;
    const localDraft = localStorage.getItem(draftKey);

    if (localDraft) {
      fileContent = localDraft;
    } else {
      const res = await fetch(`/api/file?repo=${repo}&path=${filePath}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch file content: ${res.statusText}`);
      const data = await res.json();
      const binaryString = atob(data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileContent = new TextDecoder('utf-8').decode(bytes);
    }

    const { model, trace } = await unifiedParser(fileContent, filePath);

    if (trace.error) {
      setParsingError(trace.error);
      setRawContentOnError(fileContent);
      setContent('');
    } else if (model) {
      setFrontmatter(model.frontmatter);
      setFileType(model.rawType);
      setOriginalBody(model.originalBody || model.body || '');
      
      // For Astro files with sections, convert to editable HTML
      if (model.rawType === 'astro-ast' && model.frontmatter.sections) {
        const sections = model.frontmatter.sections;
        setOriginalSections(sections);
        const editableHTML = await sectionsToEditableHTML(sections);
        setContent(editableHTML);
      } else if (model.rawType === 'astro-ast') {
        // Astro file without sections
        setContent('<p><em>This Astro file does not have a sections array to edit.</em></p>');
      } else {
        // Regular markdown file
        setContent(model.body);
      }
    } else {
      throw new Error('An unknown parsing error occurred.');
    }

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

fetchAndParseContent();
```

}, [repo, filePath, draftKey]);

const handleEditorChange = (newContent, editor) => {
setContent(newContent);

```
// Only save draft for Astro files with sections
if (fileType === 'astro-ast' && originalSections.length > 0) {
  saveDraft(newContent, frontmatter, originalBody, originalSections);
} else if (fileType !== 'astro-ast') {
  // For regular markdown files, save as before
  const fullContent = matter.stringify(newContent, frontmatter);
  localStorage.setItem(draftKey, fullContent);
}
```

};

if (loading || content === null) {
return <div className="text-center p-8">Loading editor…</div>;
}

if (error) {
return <div className="text-center p-8 text-red-600">{error}</div>;
}

const editorConfig = {
height: ‘100%’,
width: ‘100%’,
menubar: false,
mobile: {
theme: ‘silver’,
plugins: ‘lists link’,
toolbar: ‘undo redo | bold italic | bullist numlist | link’
},
plugins: [
‘advlist’, ‘autolink’, ‘lists’, ‘link’, ‘image’, ‘charmap’,
‘searchreplace’, ‘visualblocks’, ‘code’,
‘insertdatetime’, ‘table’, ‘help’, ‘wordcount’
],
toolbar: ‘undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link | removeformat’,
content_style: `body {  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;  font-size: 16px; line-height: 1.6; padding: 1rem; } .section { margin-bottom: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px; } .hero-section { text-align: center; padding: 2rem 1rem; } .grid-section { padding: 1rem; } .grid-items { display: grid; gap: 1rem; margin-top: 1rem; } .grid-item { padding: 1rem; background: white; border-radius: 6px; border: 1px solid #e5e7eb; } hr { margin: 2rem 0; border: none; border-top: 2px dashed #d1d5db; }`,
};

return (
<div className="flex flex-col h-screen">
<TopToolbar />
{parsingError && <ErrorDisplay error={parsingError} rawContent={rawContentOnError} />}
{fileType === ‘astro-ast’ && originalSections.length > 0 && (
<div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-800">
📝 <strong>Section Editor:</strong> Edit the content below. Each section is clearly marked. Changes are auto-saved.
</div>
)}
<div className="flex-grow w-full">
<Editor
value={content}
init={editorConfig}
onEditorChange={handleEditorChange}
/>
</div>
<BottomToolbar />
</div>
);
}

export default EditorPage;
