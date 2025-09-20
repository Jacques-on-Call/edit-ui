import FileExplorer from './FileExplorer';

function ExplorerPage() {
  // Hardcoded for debugging without login
  const selectedRepo = 'test-repo';

  return <FileExplorer repo={selectedRepo} />;
}

export default ExplorerPage;
