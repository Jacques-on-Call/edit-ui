import FileExplorer from './FileExplorer';

function ExplorerPage() {
  const selectedRepo = localStorage.getItem('selectedRepo');

  if (!selectedRepo) {
    // This can happen if the user navigates here directly without selecting a repo
    return <div>No repository selected. Please go back and select a repository.</div>;
  }

  return <FileExplorer repo={selectedRepo} />;
}

export default ExplorerPage;
