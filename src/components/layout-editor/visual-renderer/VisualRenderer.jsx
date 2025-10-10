import React, { useState, useEffect } from 'react';
import { normalizeFrontmatter, validateLayoutSchema } from '../../../utils/layoutInterpreter';
import { extractComponentsFromAstro } from '../../../utils/componentMapper';
import { generateAstroPreviewHtml, generateFallbackHtml } from '../../../utils/layoutRenderer';
import matter from 'gray-matter';

/**
 * A component that orchestrates the parsing and rendering of an Astro layout file preview.
 * It uses the layout utilities to process the file and then renders the result
 * into a sandboxed iframe. It handles both successful renders and detailed error fallbacks.
 *
 * @param {{ fileContent: string; filePath: string; }} props
 */
const VisualRenderer = ({ fileContent, filePath }) => {
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processLayout = async () => {
      setIsLoading(true);
      const errors = [];
      let frontmatter = {};
      let components = [];

      // 1. Separate frontmatter from body
      const { content: bodyContent } = matter(fileContent);

      // 2. Normalize and Validate Frontmatter
      frontmatter = await normalizeFrontmatter(fileContent, filePath);
      if (frontmatter.error) {
        errors.push(frontmatter.error);
      } else {
        const { isValid, errors: validationErrors } = validateLayoutSchema(frontmatter);
        if (!isValid) {
          errors.push(...validationErrors);
        }
      }

      // 3. Extract Components from Body
      const { components: extractedComponents, error: componentError } = extractComponentsFromAstro(bodyContent);
      if (componentError) {
        errors.push(componentError);
      } else {
        components = extractedComponents;
      }

      // 4. Generate appropriate HTML
      if (errors.length > 0) {
        setPreviewHtml(generateFallbackHtml({
          filePath,
          errors,
          frontmatter,
          components,
        }));
      } else {
        setPreviewHtml(generateAstroPreviewHtml(fileContent, frontmatter, components));
      }

      setIsLoading(false);
    };

    processLayout();
  }, [fileContent, filePath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500 animate-pulse">Analyzing Layout...</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={previewHtml}
      title={`Preview for ${filePath}`}
      className="w-full h-full border-none"
      sandbox="allow-scripts" // Allow scripts for potential interactivity from Tailwind CDN, etc.
    />
  );
};

export default VisualRenderer;