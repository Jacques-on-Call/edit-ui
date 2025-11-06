import Icon from './Icon';

function SearchResult({ file, searchQuery, onSelect }) {
  const { name, content } = file;
  const lowerCaseContent = content.toLowerCase();
  const lowerCaseQuery = searchQuery.toLowerCase();
  const index = lowerCaseContent.indexOf(lowerCaseQuery);

  const getSnippet = () => {
    if (index === -1) {
      return content.substring(0, 100) + '...';
    }
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + lowerCaseQuery.length + 30);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < content.length ? '...' : '';
    const highlighted = content.substring(index, index + lowerCaseQuery.length);
    return (
      <>
        {prefix}
        {content.substring(start, index)}
        <span className="bg-accent-lime text-black">{highlighted}</span>
        {content.substring(index + lowerCaseQuery.length, end)}
        {suffix}
      </>
    );
  };

  return (
    <div
      className="p-4 bg-white/5 border border-white/10 rounded-lg mb-4 cursor-pointer hover:bg-white/10"
      onClick={() => onSelect(file)}
    >
      <div className="flex items-center mb-2">
        <Icon name="FileText" className="w-5 h-5 mr-2 text-cyan-400" />
        <h3 className="font-semibold text-white truncate">{name}</h3>
      </div>
      <p className="text-sm text-gray-400">{getSnippet()}</p>
    </div>
  );
}

export default SearchResult;
