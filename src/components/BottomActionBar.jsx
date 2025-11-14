// easy-seo/src/components/BottomActionBar.jsx
import { h } from 'preact';

const BottomActionBar = ({ onHome, onAdd, onPublish, slug }) => {
  const handleHome = () => console.log('[BottomBar] Home clicked');
  const handleAdd = () => console.log('[BottomBar] Add clicked');
  const handlePublish = () => {
    console.log('[BottomBar] Publish clicked');
    if (onPublish) {
      onPublish(slug);
    }
  };

  return (
    <div class="p-2 bg-gray-800 border-t border-gray-700 flex justify-around">
      <button onClick={handleHome} class="p-2 hover:bg-gray-700 rounded">Home</button>
      <button onClick={handleAdd} class="p-2 hover:bg-gray-700 rounded">Add</button>
      <button onClick={handlePublish} class="p-2 bg-blue-600 hover:bg-blue-500 rounded">Publish</button>
    </div>
  );
};

export default BottomActionBar;
