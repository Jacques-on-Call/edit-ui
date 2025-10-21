import { markerizeAstro } from "../markerizeAstro";
import { it, expect } from 'vitest';

const legacy = `---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
const { title = "Site", count = 1, published = false } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{title}</title>
  </head>
  <body>
    <Header />
    <slot />
    <Footer />
  </body>
</html>
`;

it("adds imports, props, head, content-slot, pre/post markers", () => {
  const { content, report } = markerizeAstro(legacy);
  expect(report.changed).toBe(true);
  expect(report.added.imports).toBe(true);
  expect(report.added.props).toBe(true);
  expect(report.added.head).toBe(true);
  expect(report.added.contentSlot).toBe(true);
  expect(report.added.preContent).toBe(true);
  expect(report.added.postContent).toBe(true);

  expect(content).toMatch(/\/\*\s*editor:region\s+name="imports"/);
  expect(content).toMatch(/\/\*\s*editor:region\s+name="props"/);
  expect(content).toMatch(/<!--\s*editor:region\s+name="head"/);
  expect(content).toMatch(/<!--\s*editor:content-slot/);
  expect(content).toMatch(/<!--\s*editor:region\s+name="pre-content"/);
  expect(content).toMatch(/<!--\s*editor:region\s+name="post-content"/);
});
