import { compileAstro } from "../compileAstro";
import { parseAstroToBlueprint } from "../parseAstro";
import type { LayoutBlueprint } from "../types";
import { test, expect } from 'vitest';

test("parse props from destructure when JSON marker is absent", () => {
  const input = `---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
const { title = "Site", count = 3, published = false } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- editor:region name="head" -->
    <title>{Astro.props.title}</title>
    <!-- /editor:region -->
  </head>
  <body>
    <!-- editor:region name="pre-content" -->
    <Header />
    <!-- /editor:region -->
    <!-- editor:content-slot name="Content" single -->
    <slot />
    <!-- /editor:content-slot -->
    <!-- editor:region name="post-content" -->
    <Footer />
    <!-- /editor:region -->
  </body>
</html>`;

  const bp = parseAstroToBlueprint(input);
  expect(bp).not.toBeNull();
  expect(bp!.props.title).toEqual({ type: "string", default: "Site" });
  expect(bp!.props.count).toEqual({ type: "number", default: 3 });
  expect(bp!.props.published).toEqual({ type: "boolean", default: false });

  const out = compileAstro(bp!);
  // Compiled output will include JSON props marker; destructure defaults come from parsed props
  expect(out).toContain(`/* editor:region name="props"`);
  expect(out).toContain(`"title":{"type":"string","default":"Site"}`);
  expect(out).toContain(`"count":{"type":"number","default":3}`);
  expect(out).toContain(`"published":{"type":"boolean","default":false}`);
});

test("JSON marker props win; destructure fills only missing keys", () => {
  const input = `---
import Header from "../components/Header.astro";
const { title = "Ignored", extra = true } = Astro.props;
/* editor:region name="props"
{ "title": { "type":"string", "default":"Site" }, "count": { "type":"number", "default": 1 } }
*/
/* /editor:region */
---

<!DOCTYPE html>
<html>
  <head>
    <!-- editor:region name="head" --><title>{Astro.props.title}</title><!-- /editor:region -->
  </head>
  <body>
    <!-- editor:region name="pre-content" --><!-- /editor:region -->
    <!-- editor:content-slot name="Content" single --><slot /><!-- /editor:content-slot -->
    <!-- editor:region name="post-content" --><!-- /editor:region -->
  </body>
</html>`;

  const bp = parseAstroToBlueprint(input)!;
  // JSON takes precedence
  expect(bp.props.title.default).toBe("Site");
  expect(bp.props.count.default).toBe(1);
  // "extra" is not in JSON; it should be added from destructure
  expect(bp.props.extra).toEqual({ type: "boolean", default: true });
});
