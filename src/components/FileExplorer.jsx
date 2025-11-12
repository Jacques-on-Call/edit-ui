
import FileTile from './FileTile';

const mockFiles = [
  { sha: '1', type: 'dir', name: 'folder1' },
  { sha: '2', type: 'file', name: 'file1.md' },
  { sha: '3', type: 'file', name: 'image.png' },
];

function FileExplorer({ searchQuery }) {
  console.log(`[FileExplorer.jsx] searchQuery prop: "${searchQuery}"`);

  return (
    <div>
      <h1>File Explorer (Minimal Test)</h1>
      <p>Current search query: {searchQuery}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {mockFiles.map(file => (
          <FileTile
            key={file.sha}
            file={file}
            metadata={null}
            isSelected={false}
            onOpen={() => {}}
            onShowActions={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

export default FileExplorer;
