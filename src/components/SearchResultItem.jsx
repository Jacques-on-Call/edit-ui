import { useState } from 'preact/hooks';
import Icon from './Icon';

function HighlightedText({ text, highlight }) {
  if (!highlight.trim()) {
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
  const [isExpanded, setIsExpanded] = useState(false);
  const relativePath = result.path.replace('src/pages/', '');

  return (
    <div className="border-b border-gray-700">
      <div
        className="flex items-center p-2 cursor-pointer hover:bg-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Icon name="File" className="w-5 h-5 mr-3" />
        <div className="flex-grow">
          <div className="font-semibold">{result.name}</div>
          <div className="text-xs text-gray-400">{relativePath}</div>
        </div>
        <div className="text-sm text-gray-400 mr-3">{result.matchCount} matches</div>
        <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} className="w-5 h-5" />
      </div>
      {isExpanded && (
        <div className="pl-10 pr-4 pb-2">
          {result.snippets.map((snippet, index) => (
            <div key={index} className="text-sm text-gray-300 my-1">
              <span className="text-gray-500 mr-2">{snippet.lineNumber}:</span>
              <HighlightedText text={snippet.line} highlight={query} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
