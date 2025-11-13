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
          <span key={i} className="bg-yellow-400 text-black">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function SearchResultItem({ result, query }) {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const relativePath = result.path.replace('src/pages/', '');
  const fileName = result.path.split('/').pop();

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
      {isExpanded && result.snippet && (
        <div className="pl-10 pr-4 pb-2 bg-gray-900">
          <div className="text-sm my-2 font-mono border border-gray-700 rounded p-2">
            {result.snippet.before && (
              <div className="text-gray-500 opacity-75 whitespace-pre-wrap">
                <span className="select-none mr-2 text-right inline-block w-8">-</span>
                <span>{result.snippet.before}</span>
              </div>
            )}
            <div className="text-gray-200 bg-gray-800 my-1 whitespace-pre-wrap">
              <span className="select-none mr-2 text-right inline-block w-8 bg-blue-900">></span>
              <HighlightedText text={result.snippet.match} highlight={query} />
            </div>
            {result.snippet.after && (
              <div className="text-gray-500 opacity-75 whitespace-pre-wrap">
                <span className="select-none mr-2 text-right inline-block w-8">+</span>
                <span>{result.snippet.after}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
