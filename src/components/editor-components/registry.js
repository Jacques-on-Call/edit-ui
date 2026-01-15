// easy-seo/src/components/editor-components/registry.js
import HeroEditor from './HeroEditor';
import BodySectionEditor from './BodySectionEditor';
import FooterEditor from './FooterEditor';
import ContactFormEditor from './ContactFormEditor';

// This object will map section type strings (e.g., 'hero', 'bodySection')
// to the Preact components responsible for rendering their editor UI.
const editorComponentRegistry = {
  'hero': HeroEditor,
  'bodySection': BodySectionEditor,
  'textSection': BodySectionEditor, // <-- ADDED: alias to restore previously-saved sections
  'footer': FooterEditor,
  'contactForm': ContactFormEditor,
};

export default editorComponentRegistry;
