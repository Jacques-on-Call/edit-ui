import styles from './Footer.module.css';
import Icon from '../../icons';
import Button from '../Button/Button';

function Footer({ currentPath, onGoHome, onCreate }) {
  // Determine if we are at the root directory
  const isAtRoot = currentPath === 'src/pages';

  // Function to get the current folder name for display
  const getFolderName = () => {
    if (isAtRoot) return '';
    const segments = currentPath.split('/');
    return segments[segments.length - 1];
  };

  return (
    <footer className={styles.footer}>
      {/* Left section is intentionally empty to push other elements to the center and right */}
      <div className={styles.footerSection}></div>

      {/* Center section for the 'Create' button */}
      <div className={`${styles.footerSection} ${styles.center}`}>
        <Button
          variant="fab"
          onClick={onCreate}
          className={styles.createButton}
          aria-label="Create new file or folder"
        >
          <Icon name="plus" />
        </Button>
      </div>

      {/* Right section for the 'Home' button */}
      <div className={`${styles.footerSection} ${styles.right}`}>
        <button
          onClick={onGoHome}
          className={`${styles.homeButton} ${isAtRoot ? styles.inactive : ''}`}
          disabled={isAtRoot}
          aria-label="Go to home directory"
        >
          <Icon name="home" />
          {/* Only show the folder name if we are not at the root */}
          {!isAtRoot && (
            <span className={styles.folderName}>{getFolderName()}</span>
          )}
        </button>
      </div>
    </footer>
  );
}

export default Footer;