// easy-seo/src/components/editor-components/registry.js
import HeroEditor from './HeroEditor';
import BodySectionEditor from './BodySectionEditor';
import FooterEditor from './FooterEditor';

// This object will map section type strings (e.g., 'hero', 'bodySection')
// to the Preact components responsible for rendering their editor UI.
const editorComponentRegistry = {
  'hero': HeroEditor,
  'bodySection': BodySectionEditor,
  'footer': FooterEditor,
};

export default editorComponentRegistry;
