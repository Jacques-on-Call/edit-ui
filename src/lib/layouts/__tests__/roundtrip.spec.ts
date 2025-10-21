import { compileAstro } from "../compileAstro";
import { parseAstroToBlueprint } from "../parseAstro";
import type { LayoutBlueprint } from "../types";
import { it, expect } from 'vitest';

const bp: LayoutBlueprint = {
  name: "MainLayout",
  htmlAttrs: { lang: "en" },
  imports: [
    { as: "Header", from: "../components/Header.astro" },
    { as: "Footer", from: "../components/Footer.astro" },
  ],
  props: { title: { type: "string", default: "Site" } },
  head: [
    { type: "meta", attrs: { charset: "utf-8" } },
    { type: "meta", attrs: { name: "viewport", content: "width=device-width, initial-scale=1" } },
    { type: "title", contentFromProp: "title" },
  ],
  preContent: [{ type: "component", name: "Header" }],
  contentSlot: { name: "Content", single: true },
  postContent: [{ type: "component", name: "Footer" }],
};

it("round-trips compile -> parse -> compile", () => {
  const astro = compileAstro(bp);
  const parsed = parseAstroToBlueprint(astro);
  expect(parsed).not.toBeNull();
  const astro2 = compileAstro(parsed!);
  // Normalize whitespace to reduce flakiness
  expect(astro2.replace(/\s+/g, " ").trim()).toEqual(astro.replace(/\s+/g, " ").trim());
});
