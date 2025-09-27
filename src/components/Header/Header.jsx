import styles from './Header.module.css';

// This is a simple layout component. It provides the styled container.
// The actual content (like the SearchBar) will be passed in as a child.
function Header({ children }) {
  return (
    <header className={styles.header}>
      {children}
    </header>
  );
}

export default Header;