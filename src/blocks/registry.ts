export type BlockProp = { name: string; type: "string" | "number" | "boolean" | "array" | "object"; default?: any };
export type BlockDef = { name: string; path: string; props: BlockProp[] };

export const BLOCKS: BlockDef[] = [
  { name: "Section", path: "src/blocks/Section.astro", props: [
    { name: "tag", type: "string", default: "section" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Columns", path: "src/blocks/Columns.astro", props: [
    { name: "gap", type: "string", default: "1rem" },
    { name: "stackAt", type: "string", default: "640px" },
  ]},
  { name: "Column", path: "src/blocks/Column.astro", props: [
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Image", path: "src/blocks/Image.astro", props: [
    { name: "src", type: "string", default: "" },
    { name: "alt", type: "string", default: "" },
    { name: "width", type: "string", default: "" },
    { name: "height", type: "string", default: "" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Button", path: "src/blocks/Button.astro", props: [
    { name: "href", type: "string", default: "#" },
    { name: "label", type: "string", default: "Click" },
    { name: "variant", type: "string", default: "primary" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Table", path: "src/blocks/Table.astro", props: [
    { name: "headers", type: "array", default: [] },
    { name: "rows", type: "array", default: [] },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
  { name: "Background", path: "src/blocks/Background.astro", props: [
    { name: "image", type: "string", default: "" },
    { name: "color", type: "string", default: "" },
    { name: "className", type: "string", default: "" },
    { name: "style", type: "string", default: "" },
  ]},
];
