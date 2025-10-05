import { useState, useEffect, useCallback } from ‘react’;
import { useSearchParams } from ‘react-router-dom’;
import { Editor } from ‘@tinymce/tinymce-react’;
import { debounce } from ‘lodash’;
import matter from ‘gray-matter’;
import TopToolbar from ‘../components/TopToolbar’;
import BottomToolbar from ‘../components/BottomToolbar’;
import { unifiedParser } from ‘../utils/unifiedParser’;
import { stringifyAstroFile } from ‘../utils/astroFileParser’;

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
const [originalBody, setOriginalBody] = useState(’’); // Store the original component markup
const [fileType, setFileType] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [parsingError, setParsingError] = useState(null);
const [rawContentOnError, setRawContentOnError] = useState(’’);

const draftKey = `draft_${repo}_${filePath}`;

const saveDraft = useCallback(debounce((newContent, currentFrontmatter, currentFileType, currentOriginalBody) => {
let fullContent;

```
if (currentFileType === 'astro-ast' && !parsingError) {
  // For Astro files, preserve the original component markup
  fullContent = stringifyAstroFile(currentFrontmatter, currentOriginalBody);
} else if (!parsingError) {
  // For markdown files, use the edited content
  fullContent = matter.stringify(newContent, currentFrontmatter);
} else {
  fullContent = newContent;
}

localStorage.setItem(draftKey, fullContent);
console.log(`Draft saved for ${filePath}.`);
```

}, 1000), [draftKey, parsingError, filePath]);

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
      
      // For Astro files, store the original body separately
      if (model.rawType === 'astro-ast') {
        setOriginalBody(model.originalBody || '');
        // Render sections data as editable JSON for now
        // In a production app, you'd create a custom section editor
        const sectionsData = model.frontmatter.sections || [];
        setContent(`<h2>Editing Sections Data</h2><p>Note: This is a simplified view. In production, you'd have a custom section editor.</p><pre>${JSON.stringify(sectionsData, null, 2)}</pre>`);
      } else {
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
saveDraft(newContent, frontmatter, fileType, originalBody);
};

if (loading || content === null) {
return <div className="text-center p-8">Loading editor…</div>;
}

if (error) {
return <div className="text-center p-8 text-red-600">{error}</div>;
}

const editorConfig = parsingError
? {
height: ‘100%’,
width: ‘100%’,
menubar: false,
toolbar: ‘undo redo | code’,
plugins: ‘code’
}
: {
height: ‘100%’,
width: ‘100%’,
menubar: false,
plugins: [
‘advlist’, ‘autolink’, ‘lists’, ‘link’, ‘image’, ‘charmap’, ‘preview’,
‘anchor’, ‘searchreplace’, ‘visualblocks’, ‘code’, ‘fullscreen’,
‘insertdatetime’, ‘media’, ‘table’, ‘code’, ‘help’, ‘wordcount’
],
toolbar: ’undo redo | blocks | ’ +
’bold italic forecolor | alignleft aligncenter ’ +
’alignright alignjustify | bullist numlist outdent indent | ’ +
‘removeformat | help’,
content_style: ‘body { font-family:Helvetica,Arial,sans-serif; font-size:14px }’
};

return (
<div className="flex flex-col h-screen">
<TopToolbar />
{parsingError && <ErrorDisplay error={parsingError} rawContent={rawContentOnError} />}
{fileType === ‘astro-ast’ && (
<div className="bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800">
⚠️ <strong>Astro Component File:</strong> This file uses components. Direct HTML editing is disabled.
You should edit the frontmatter data or use a specialized section editor.
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
