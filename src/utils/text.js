export const normalize = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[“”]/g, '"') // Smart double quotes to straight
    .replace(/[‘’]/g, "'") // Smart single quotes to straight
    // Replace other punctuation with a space to avoid merging words, but still "ignore" them.
    // Keep '_' as it's important for filenames.
    .replace(/[-/:;()$&@“.,?!’[\]{}#%^*+=|~<>€£¥•]/g, ' ')
    .replace(/\s+/g, ' ') // Collapse multiple spaces into one
    .trim();
};
