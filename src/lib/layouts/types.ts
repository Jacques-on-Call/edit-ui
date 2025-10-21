export type ImportSpec = { as: string; from: string };
export type PropSpec = { type: "string" | "number" | "boolean"; default?: any };

export type HeadNode =
  | { type: "meta"; attrs: Record<string, string> }
  | { type: "title"; contentFromProp?: string; text?: string }
  | { type: "raw"; html: string };

export type BodyNode =
  | { type: "component"; name: string; props?: Record<string, any> }
  | { type: "raw"; html: string };

export type LayoutBlueprint = {
  name: string;
  htmlAttrs?: Record<string, string>;
  imports: ImportSpec[];
  props: Record<string, PropSpec>;
  head: HeadNode[];
  preContent: BodyNode[];
  contentSlot: { name: string; single?: boolean };
  postContent: BodyNode[];
};
