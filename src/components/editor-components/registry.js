// easy-seo/src/components/editor-components/registry.js
import HeroEditor from './HeroEditor';

// This object will map section type strings (e.g., 'hero', 'textSection')
// to the Preact components responsible for rendering their editor UI.
const editorComponentRegistry = {
  'hero': HeroEditor,
};

export default editorComponentRegistry;
