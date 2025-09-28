import { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

function ContextMenu({ x, y, file, onClose, onRename, onDelete, onDuplicate, onMove }) {
  const menuRef = useRef(null);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleAction = (action) => {
    // It's important to close the menu first, then trigger the action that
    // will open a modal (e.g., Delete, Rename). This prevents a race condition
    // where the new modal might not appear if the state updates happen too
    // close together.
    onClose();
    action(file);
  };

  return (
    <div className={styles.contextMenuOverlay} onClick={onClose}>
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{ top: `${y}px`, left: `${x}px` }}
      >
        <ul>
          <li onClick={() => handleAction(onRename)}>Rename</li>
          <li onClick={() => handleAction(onDelete)}>Delete</li>
          {file.type !== 'dir' && (
            <li onClick={() => handleAction(onDuplicate)}>Duplicate</li>
          )}
          <li onClick={() => handleAction(onMove)}>Move</li>
        </ul>
      </div>
    </div>
  );
}

export default ContextMenu;
