/**
 * @typedef {Object} IntegrityReport
 * @property {boolean} isValid - Overall validity of the layout data.
 * @property {string[]} errors - A list of specific validation errors.
 * @property {string[]} warnings - A list of potential issues or missing optional fields.
 */

/**
 * Validates the integrity of a Craft.js layout JSON object.
 *
 * @param {string | object} layoutData - The layout data, either as a JSON string or a parsed object.
 * @returns {IntegrityReport} - An object containing the validation results.
 */
export function checkLayoutIntegrity(layoutData) {
  const report = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  let parsedData;

  if (typeof layoutData === 'string') {
    try {
      parsedData = JSON.parse(layoutData);
    } catch (e) {
      report.isValid = false;
      report.errors.push(`Invalid JSON: The provided data is not a valid JSON string. Error: ${e.message}`);
      return report;
    }
  } else if (typeof layoutData === 'object' && layoutData !== null) {
    parsedData = layoutData;
  } else {
    report.isValid = false;
    report.errors.push('Invalid Data Type: The provided layout data is not a string or an object.');
    return report;
  }

  if (!parsedData.ROOT) {
    report.isValid = false;
    report.errors.push('Missing ROOT Node: The layout data must have a "ROOT" property.');
    return report; // No further checks are possible without a ROOT node.
  }

  const rootNode = parsedData.ROOT;

  // Check for essential properties on the ROOT node
  const requiredProps = ['type', 'props', 'nodes'];
  requiredProps.forEach(prop => {
    if (typeof rootNode[prop] === 'undefined') {
      report.isValid = false;
      report.errors.push(`Missing ROOT Property: The ROOT node is missing the essential "${prop}" property.`);
    }
  });

  if (rootNode.type?.resolvedName !== 'Page') {
    report.warnings.push(`Unexpected ROOT Type: The ROOT node type is "${rootNode.type?.resolvedName}" instead of "Page". This might be intentional but is worth checking.`);
  }

  if (!Array.isArray(rootNode.nodes)) {
     report.isValid = false;
     report.errors.push('Invalid "nodes" Property: The "nodes" property on the ROOT node must be an array.');
  }

  if (Object.keys(parsedData).length > 1) {
    report.warnings.push('Extraneous Properties: The layout data contains other top-level keys besides "ROOT". This could indicate an incorrect serialization format.');
  }

  return report;
}