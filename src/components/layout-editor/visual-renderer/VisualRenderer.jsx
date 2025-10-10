import React, { useState, useEffect } from 'react';
import { normalizeFrontmatter, validateLayoutSchema } from '../../../utils/layoutInterpreter';
import { parseAstroComponents } from '../../../utils/componentMapper';
import { generateAstroPreviewHtml, generateFallbackHtml } from '../../../utils/layoutRenderer';
import { normalizeLayoutData } from '../../../utils/normalizationPatch';

/**
 * A component that orchestrates the parsing and rendering of an Astro layout file preview.
 * It uses the layout utilities to process the file and then renders the result
 * into a sandboxed iframe. It handles both successful renders and detailed error fallbacks.
 *
 * @param {{ fileContent: string; filePath: string; onError: (details: object) => void; }} props
 */
const VisualRenderer = ({ fileContent, filePath, onError }) => {
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processLayout = async () => {
      setIsLoading(true);
      const report = {
          errors: [],
          warnings: [],
          frontmatter: {},
          components: [],
          islands: [],
          filePath,
      };

      // 1. Separate frontmatter from body
      // const { content: bodyContent } = matter(fileContent); // No longer needed as the compiler handles the full file.

      // 2. Normalize and Validate Frontmatter
      let rawFrontmatter = await normalizeFrontmatter(fileContent, filePath);
      if (rawFrontmatter.error) {
        report.errors.push(rawFrontmatter.error);
        report.frontmatter = normalizeLayoutData(rawFrontmatter); // Normalize even on error
      } else {
        report.frontmatter = normalizeLayoutData(rawFrontmatter);
        const { isValid, errors: validationErrors, warnings } = validateLayoutSchema(report.frontmatter);
        if (!isValid) {
          report.errors.push(...validationErrors);
        }
        report.warnings = warnings; // Pass warnings along
      }

      // 3. Parse Components and Islands using the new compiler
      const { components, islands, error: parseError } = await parseAstroComponents(fileContent);
      if (parseError) {
        report.errors.push(parseError);
      } else {
        report.components = components;
        report.islands = islands;
      }

      // 4. Generate appropriate HTML and report state
      try {
        if (report.errors.length > 0) {
          // If there are validation errors, render the fallback UI immediately.
          setPreviewHtml(generateFallbackHtml(report, false, false));
          onError({ ...report, ready: false });
        } else {
          // If validation passes, try to generate the full visual preview.
          // This is where a real renderer would go. For now, we use the placeholder.
          const visualHtml = generateAstroPreviewHtml(fileContent, report.frontmatter, report.components);
          setPreviewHtml(visualHtml);
          // Report success, but indicate the full visual renderer isn't "ready" yet.
          // This can be set to `true` once a real renderer is implemented.
          onError({ ...report, ready: true, errors: [] }); // No critical errors
        }
      } catch (e) {
        // Catch any unexpected rendering errors.
        report.errors.push(`A critical error occurred during rendering: ${e.message}`);
        setPreviewHtml(generateFallbackHtml(report, false, false));
        onError({ ...report, ready: false });
      }

      setIsLoading(false);
    };

    processLayout();
  }, [fileContent, filePath, onError]);

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