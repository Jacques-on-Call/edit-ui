import React from 'react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span>Editor</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.button}>Save</button>
        <button className={styles.button}>Publish</button>
        <button className={styles.button}>Status</button>
      </div>
    </header>
  );
};

export default Header;