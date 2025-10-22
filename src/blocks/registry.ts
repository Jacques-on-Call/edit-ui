export type ControlType = "string" | "number" | "boolean" | "select" | "textarea";

export type BlockProp = {
  name: string;
  type: ControlType;
  label?: string;
  default?: any;
  required?: boolean;
  options?: string[];
  helpText?: string;
};

export type BlockDef = {
  name: string;
  tag: string;
  path: string; // path in the repo (Astro project)
  props: BlockProp[];
  allowChildren?: boolean;
  allowedChildTypes?: string[];
  version?: number;
  category?: string;
};

export const BLOCKS: BlockDef[] = [
  {
    name: "Section",
    tag: "Section",
    path: "src/blocks/Section.astro",
    category: "Layout",
    version: 1,
    allowChildren: true,
    props: [
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
      { name: "id", type: "string", label: "ID", default: "" },
      { name: "ariaLabel", type: "string", label: "ARIA Label", default: "" },
    ],
  },
  {
    name: "Columns",
    tag: "Columns",
    path: "src/blocks/Columns.astro",
    category: "Layout",
    version: 1,
    allowChildren: true,
    allowedChildTypes: ["Column"],
    props: [
      { name: "gap", type: "string", label: "Gap", default: "1rem" },
      { name: "minCol", type: "string", label: "Min Column Width", default: "220px" },
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
    ],
  },
  {
    name: "Column",
    tag: "Column",
    path: "src/blocks/Column.astro",
    category: "Layout",
    version: 1,
    allowChildren: true,
    props: [
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
    ],
  },
  {
    name: "Image",
    tag: "Image",
    path: "src/blocks/Image.astro",
    category: "Content",
    version: 1,
    allowChildren: false,
    props: [
      { name: "src", type: "string", label: "Source URL", default: "", required: true },
      { name: "alt", type: "string", label: "Alt Text", default: "" },
      { name: "width", type: "string", label: "Width", default: "" },
      { name: "height", type: "string", label: "Height", default: "" },
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
    ],
  },
  {
    name: "Button",
    tag: "Button",
    path: "src/blocks/Button.astro",
    category: "Content",
    version: 1,
    allowChildren: false,
    props: [
      { name: "href", type: "string", label: "Link (optional)", default: "" },
      { name: "label", type: "string", label: "Label", default: "Click", required: true },
      { name: "variant", type: "select", label: "Variant", default: "primary", options: ["primary", "secondary", "ghost"] },
      { name: "newTab", type: "boolean", label: "Open in new tab", default: false },
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
    ],
  },
  {
    name: "Table",
    tag: "Table",
    path: "src/blocks/Table.astro",
    category: "Content",
    version: 1,
    allowChildren: false,
    props: [
      { name: "caption", type: "string", label: "Caption", default: "" },
      { name: "headers", type: "textarea", label: "Headers (JSON array)", default: "[]" },
      { name: "rows", type: "textarea", label: "Rows (JSON array of arrays)", default: "[]" },
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
    ],
  },
  {
    name: "Background",
    tag: "Background",
    path: "src/blocks/Background.astro",
    category: "Layout",
    version: 1,
    allowChildren: true,
    props: [
      { name: "color", type: "string", label: "Background Color", default: "" },
      { name: "image", type: "string", label: "Background Image URL", default: "" },
      { name: "class", type: "string", label: "CSS classes", default: "" },
      { name: "style", type: "string", label: "Inline style", default: "" },
    ],
  },
];
