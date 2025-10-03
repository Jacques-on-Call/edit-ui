import { useLocation } from 'react-router-dom';
import FileViewer from './FileViewer.jsx';

function FileViewerPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const path = params.get('path');
  const selectedRepo = localStorage.getItem('selectedRepo');

  if (!selectedRepo) {
    return <div>No repository selected. Please go back and select a repository.</div>;
  }

  if (!path) {
    return <div>No file path specified.</div>;
  }

  return <FileViewer repo={selectedRepo} path={path} />;
}

export default FileViewerPage;