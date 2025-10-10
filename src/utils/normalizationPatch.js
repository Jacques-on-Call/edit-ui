/**
 * @file Normalization Patch System
 * @description Ensures layout data conforms to a safe base schema before rendering.
 */

const baseLayoutSchema = {
  title: 'string',
  description: 'string',
  meta: 'object',
  schema: 'object',
};

const defaultLayoutValues = {
  title: 'Untitled Layout',
  description: 'No description provided.',
  meta: {},
  schema: {},
};

/**
 * Reshapes a layout's frontmatter to a safe base schema.
 * This function adds missing required properties with default values and ensures
 * that optional properties are of the correct type.
 *
 * @param {object} frontmatter - The raw frontmatter object from a layout file.
 * @returns {object} The normalized frontmatter object.
 */
export function normalizeLayoutData(frontmatter) {
  if (typeof frontmatter !== 'object' || frontmatter === null) {
    return { ...defaultLayoutValues };
  }

  const normalizedData = { ...frontmatter };

  for (const key in baseLayoutSchema) {
    const expectedType = baseLayoutSchema[key];
    const actualType = typeof normalizedData[key];

    if (actualType !== expectedType) {
      // If the key is missing or has the wrong type, apply the default value.
      normalizedData[key] = defaultLayoutValues[key];
    }
  }

  return normalizedData;
}