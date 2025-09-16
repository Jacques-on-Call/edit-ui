import './FileTile.css';

function FileTile({ file, onClick }) {
  const isDirectory = file.type === 'dir';
  const icon = isDirectory ? '📁' : '📄';

  return (
    <div className="file-tile" onClick={onClick}>
      <div className="icon">{icon}</div>
      <div className="name">{file.name}</div>
    </div>
  );
}

export default FileTile;
