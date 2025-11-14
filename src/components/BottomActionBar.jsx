import { h } from 'preact';
import './BottomActionBar.css';

export default function BottomActionBar({ onAdd, onPublish }) {
  return (
    <footer className="bottom-action-bar">
      <button className="bar-btn" onClick={onAdd}>
        <span className="bar-add">+</span> Add
      </button>
      <button className="bar-btn bar-publish" onClick={onPublish}>
        Publish
      </button>
    </footer>
  );
}
