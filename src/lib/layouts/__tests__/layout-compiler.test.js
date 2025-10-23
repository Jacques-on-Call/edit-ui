import { describe, it, expect } from 'vitest';
import { compileAstro } from '../compileAstro';
import { parseAstroToBlueprint } from '../parseAstro';
import { validateAstroLayout } from '../validateAstro';

const goldenBlueprint = {
  name: 'Golden Layout',
  htmlAttrs: { lang: 'en' },
  imports: [
    { as: 'Header', from: '../../components/Header.astro' },
    { as: 'Footer', from: '../../components/Footer.astro' },
  ],
  props: {
    title: { type: 'string', default: 'My Awesome Site' },
  },
  head: [{ type: 'raw', html: '<meta charset="utf-8" />' }],
  preContent: [{ type: 'component', name: 'Header' }],
  contentSlot: { name: 'default' },
  postContent: [{ type: 'component', name: 'Footer' }],
};

const goldenAstro = `---
/* editor:region name="imports" */
import Header from "../../components/Header.astro";
import Footer from "../../components/Footer.astro";
/* /editor:region */

const { title = "My Awesome Site" } = Astro.props;
/* editor:region name="props"
{"title":{"type":"string","default":"My Awesome Site"}}
*/
/* /editor:region */
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- editor:region name="head" -->
    <meta charset="utf-8" />
    <!-- /editor:region -->
  </head>
  <body>
    <!-- editor:region name="pre-content" -->
    <Header />
    <!-- /editor:region -->

    <!-- editor:content-slot name="default" -->
    <slot />
    <!-- /editor:content-slot -->

    <!-- editor:region name="post-content" -->
    <Footer />
    <!-- /editor:region -->
  </body>
</html>
`;

describe('Layout Compiler', () => {
  it('should compile a blueprint to a valid Astro file', () => {
    const compiled = compileAstro(goldenBlueprint);
    expect(compiled.trim()).toEqual(goldenAstro.trim());
  });

  it('should parse an Astro file back to a blueprint', () => {
    const parsed = parseAstroToBlueprint(goldenAstro);
    expect(parsed.imports).toEqual(goldenBlueprint.imports);
    expect(parsed.props).toEqual(goldenBlueprint.props);
  });
});

describe('Layout Validator', () => {
  it('should validate a correct layout', () => {
    const { ok, errors } = validateAstroLayout(goldenAstro);
    expect(ok).toBe(true);
    expect(errors.length).toBe(0);
  });

  it('should invalidate a layout with no slot', () => {
    const invalid = goldenAstro.replace('<slot />', '');
    const { ok, errors } = validateAstroLayout(invalid);
    expect(ok).toBe(false);
    expect(errors[0]).toContain('exactly one <slot />');
  });

  it('should invalidate a layout with multiple slots', () => {
    const invalid = goldenAstro.replace('<slot />', '<slot /><slot />');
    const { ok, errors } = validateAstroLayout(invalid);
    expect(ok).toBe(false);
    expect(errors[0]).toContain('exactly one <slot />');
  });

  it('should invalidate a layout with nested <html> tags', () => {
    const invalid = goldenAstro.replace('<Header />', '<html><Header /></html>');
    const { ok, errors } = validateAstroLayout(invalid);
    expect(ok).toBe(false);
    expect(errors[0]).toContain('Forbidden tag');
  });
});
