import matter from 'gray-matter';
import { parseAstroFile } from './astroFileParser.js';

/**
 * @file Universal Layout Interpreter
 * @description Safely parses and validates Astro layout files for rendering in the editor.
 */

/**
 * Detects the type of layout based on keywords in the file content.
 * @param {string} fileContent - The full content of the layout file.
 * @returns {('react'|'vue'|'svelte'|'astro'|'unknown')} The detected layout type.
 */
export function detectLayoutType(fileContent) {
  if (!fileContent) return 'unknown';

  // More specific checks first
  if (fileContent.includes("import React") || fileContent.includes("from 'react'")) {
    return 'react';
  }
  if (fileContent.includes("from 'vue'")) {
    return 'vue';
  }
  if (fileContent.includes("from 'svelte'")) {
    return 'svelte';
  }
  // Generic Astro check
  if (fileContent.includes("---") && fileContent.includes("<html")) {
    return 'astro';
  }

  return 'unknown';
}

/**
 * Extracts and normalizes frontmatter from a file into a JSON object.
 * It intelligently uses the correct parser for Astro or standard files.
 * @param {string} fileContent The full string content of the file.
 * @param {string} filePath The path to the file, used to determine the file type.
 * @returns {Promise<object>} A promise that resolves to the frontmatter object, or an object with an `error` key on failure.
 */
export async function normalizeFrontmatter(fileContent, filePath) {
  try {
    if (filePath && filePath.endsWith('.astro')) {
      const { model, trace } = await parseAstroFile(fileContent);
      if (trace.error) {
        throw new Error(trace.error);
      }
      return model.frontmatter || {};
    } else {
      const { data } = matter(fileContent);
      return data || {};
    }
  } catch (err) {
    return { error: `Failed to parse frontmatter: ${err.message}` };
  }
}

/**
 * Validates a frontmatter object against a basic layout schema.
 * @param {object} frontmatter - The frontmatter object to validate.
 * @returns {{isValid: boolean, errors: string[]}} An object indicating if the schema is valid, with an array of error messages.
 */
export function validateLayoutSchema(frontmatter) {
  const errors = [];
  const warnings = [];
  const layoutSchema = {
    title: 'string',
    description: 'string',
    meta: 'object',
    schema: 'object'
  };

  if (!frontmatter || typeof frontmatter !== 'object' || frontmatter.error) {
    return { isValid: false, errors: ['Invalid or null frontmatter object.'], warnings: [] };
  }

  // CRITICAL: Check required fields. Their absence is an error.
  if (typeof frontmatter.title !== layoutSchema.title) {
    errors.push(`'title' is missing or not a string. Found: ${typeof frontmatter.title}`);
  }
  if (typeof frontmatter.description !== layoutSchema.description) {
    errors.push(`'description' is missing or not a string. Found: ${typeof frontmatter.description}`);
  }

  // NON-CRITICAL: Check optional fields. Their absence is fine, but wrong type is a warning.
  if (frontmatter.meta && typeof frontmatter.meta !== layoutSchema.meta) {
    warnings.push(`'meta' field, if present, must be an object. Found: ${typeof frontmatter.meta}`);
  }
  if (frontmatter.schema && typeof frontmatter.schema !== layoutSchema.schema) {
    warnings.push(`'schema' field, if present, must be an object. Found: ${typeof frontmatter.schema}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}