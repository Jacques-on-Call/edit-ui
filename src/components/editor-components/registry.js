// easy-seo/src/components/editor-components/registry.js
import HeroEditor from './HeroEditor';
import TextSectionEditor from './TextSectionEditor';
import FooterEditor from './FooterEditor';

// This object will map section type strings (e.g., 'hero', 'textSection')
// to the Preact components responsible for rendering their editor UI.
const editorComponentRegistry = {
  'hero': HeroEditor,
  'textSection': TextSectionEditor,
  'footer': FooterEditor,
};

export default editorComponentRegistry;
