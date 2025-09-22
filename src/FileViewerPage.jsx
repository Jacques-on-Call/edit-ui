import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FileViewer from './FileViewer';
import './FileViewer.css'; // Import the new CSS

function FileViewerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repo = localStorage.getItem('selectedRepo');
  const path = searchParams.get('path');

  useEffect(() => {
    if (!repo) {
      navigate('/');
    }
  }, [repo, navigate]);

  if (!path) {
    return <div>File path not specified.</div>;
  }

  return (
    <div className="file-viewer-page">
      <FileViewer repo={repo} path={path} />
    </div>
  );
}

export default FileViewerPage;
