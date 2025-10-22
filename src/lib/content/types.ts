export type BlockNode = {
  id: string;
  type: string; // matches BlockDef.name/tag
  props?: Record<string, any>;
  children?: BlockNode[];
};

export type ContentBlueprint = {
  root: BlockNode; // type "root", children carry actual blocks
};
