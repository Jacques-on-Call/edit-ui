import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FileViewer from './FileViewer';

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
    <div>
      <button onClick={() => navigate('/explorer')}>Back to Explorer</button>
      <FileViewer repo={repo} path={path} />
    </div>
  );
}

export default FileViewerPage;
