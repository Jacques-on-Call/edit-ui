import React from 'react';
import styles from './EditorFooter.module.css';
import { Bars3BottomLeftIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';

function EditorFooter() {
  return (
    <footer className={styles.footer}>
      <button className="text-white hover:text-gray-200"><Bars3BottomLeftIcon className="h-6 w-6" /></button>
      <button className="text-white hover:text-gray-200"><LinkIcon className="h-6 w-6" /></button>
      <button className="text-white hover:text-gray-200"><PhotoIcon className="h-6 w-6" /></button>
    </footer>
  );
}
export default EditorFooter;
