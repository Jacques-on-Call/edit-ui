import { useState } from 'preact/hooks';
import Icon from './Icon';

function HighlightedText({ text, highlight }) {
  if (!text || !highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-blue-300 text-black">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function createSnippet(snippet, query, maxLength = 100) {
  const fullText = `${snippet.before} ${snippet.match} ${snippet.after}`.replace(/\s+/g, ' ').trim();
  const queryIndex = fullText.toLowerCase().indexOf(query.toLowerCase());

  if (queryIndex === -1) {
    return fullText.length > maxLength ? `...${fullText.slice(0, maxLength)}...` : fullText;
  }

  const start = Math.max(0, queryIndex - Math.floor((maxLength - query.length) / 2));
  const end = Math.min(fullText.length, start + maxLength);

  let finalSnippet = fullText.substring(start, end);

  if (start > 0) {
    finalSnippet = `...${finalSnippet}`;
  }
  if (end < fullText.length) {
    finalSnippet = `${finalSnippet}...`;
  }

  return finalSnippet;
}

export function SearchResultItem({ result, query }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const relativePath = result.path.replace('src/pages/', '');
  const fileName = result.path.split('/').pop();

  const displaySnippet = result.snippet ? createSnippet(result.snippet, query, 80) : '';

  return (
    <div className="border-b border-gray-700">
      <div
        className="flex items-center p-2 cursor-pointer hover:bg-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Icon name="FileText" className="w-5 h-5 mr-3 flex-shrink-0" />
        <div className="flex-grow overflow-hidden">
          <div className="font-semibold truncate" title={fileName}>{fileName}</div>
          <div className="text-xs text-gray-400 truncate" title={relativePath}>{relativePath}</div>
        </div>
        <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} className="w-5 h-5 ml-3 flex-shrink-0" />
      </div>
      {isExpanded && displaySnippet && (
        <div className="pl-10 pr-4 pb-2 bg-gray-900/50">
          <div className="text-sm my-2 text-gray-300 p-2">
            <HighlightedText text={displaySnippet} highlight={query} />
          </div>
        </div>
      )}
    </div>
  );
}
