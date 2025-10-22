import { nanoid } from 'nanoid';
import { BLOCKS } from '../../blocks/registry';

/**
 * Finds a block and its parent in the tree.
 * Note: This is a simplified implementation for a flat tree structure in Phase 1.
 * It will need to be extended for nested children in Phase 2.
 * @param {Array} tree The content tree.
 * @param {String} blockId The ID of the block to find.
 * @returns {Object|null} The block and its parent, or null if not found.
 */
function findBlock(tree, blockId) {
  if (!blockId) return { block: null, parent: null, index: -1 };
  const block = tree.find(b => b.id === blockId);
  // In Phase 1, the tree is flat, so there's no parent concept.
  return block ? { block, parent: null, index: tree.indexOf(block) } : null;
}

/**
 * Inserts a new block into the content tree.
 * @param {Array} tree The current content tree.
 * @param {Object} blockDef The definition of the block to insert from the registry.
 * @param {String|null} parentId The ID of the parent to insert into. If null, adds to root.
 * @returns {Array|null} The new content tree, or null if the insertion is invalid.
 */
export function insertBlock(tree, blockDef, parentId) {
  const newBlock = {
    id: nanoid(),
    type: blockDef.name,
    children: [],
    props: {},
  };

  // Set default properties
  blockDef.props.forEach(prop => {
    newBlock.props[prop.name] = prop.default;
  });

  // Phase 1: Flat structure. We append to the root or a container at the root.
  if (!parentId) {
    // If no parent is selected, add to the root.
    return [...tree, newBlock];
  }

  const parentResult = findBlock(tree, parentId);
  if (!parentResult || !parentResult.block) {
    console.error("Parent block not found for insertion.");
    return null; // Parent not found
  }

  const parentBlock = parentResult.block;
  const parentDef = BLOCKS.find(b => b.name === parentBlock.type);

  if (!parentDef || !parentDef.allowChildren) {
    // Cannot add to a parent that doesn't allow children.
    alert(`Cannot add blocks inside a "${parentBlock.type}".`);
    return null;
  }

  if (parentDef.allowedChildTypes && !parentDef.allowedChildTypes.includes(blockDef.name)) {
    // The parent has specific child type requirements that are not met.
    alert(`A "${parentBlock.type}" cannot contain a "${blockDef.name}".`);
    return null;
  }

  // As this is a flat structure for now, we find the parent and insert after it.
  // In a future nested structure, we would add to the parent's `children` array.
  const newTree = [...tree];
  newTree.splice(parentResult.index + 1, 0, newBlock);

  return newTree;
}

/**
 * Updates the properties of a specific block.
 * @param {Array} tree The current content tree.
 * @param {String} blockId The ID of the block to update.
 * @param {Object} newProps The new properties to set.
 * @returns {Array} The new content tree with the updated block.
 */
export function updateBlockProperties(tree, blockId, newProps) {
  return tree.map(block => {
    if (block.id === blockId) {
      return { ...block, props: newProps };
    }
    return block;
  });
}

/**
 * Deletes a block from the tree.
 * @param {Array} tree The current content tree.
 * @param {String} blockId The ID of the block to delete.
 * @returns {Array} The new content tree without the deleted block.
 */
export function deleteBlock(tree, blockId) {
  return tree.filter(block => block.id !== blockId);
}

/**
 * Duplicates a block in the tree.
 * @param {Array} tree The current content tree.
 * @param {String} blockId The ID of the block to duplicate.
 * @returns {Array} The new content tree with the duplicated block.
 */
export function duplicateBlock(tree, blockId) {
  const blockIndex = tree.findIndex(block => block.id === blockId);
  if (blockIndex === -1) {
    return tree; // Block not found
  }

  const blockToDuplicate = tree[blockIndex];
  const duplicatedBlock = {
    ...blockToDuplicate,
    id: nanoid(), // Assign a new unique ID
  };

  const newTree = [...tree];
  newTree.splice(blockIndex + 1, 0, duplicatedBlock);
  return newTree;
}
