import React from 'react';
import Header from './Header';
import Footer from './Footer';
import EditorWrapper from './EditorWrapper';
import styles from './EditorPage.module.css';

const EditorPage = () => {
  return (
    <div className={styles.editorLayout}>
      <Header />
      <main className={styles.mainContent}>
        <EditorWrapper />
      </main>
      <Footer />
    </div>
  );
};

export default EditorPage;