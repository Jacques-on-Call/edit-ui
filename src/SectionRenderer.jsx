import React from 'react';
import { marked } from 'marked';

function SectionRenderer({ sections }) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return <p>This file does not contain any content sections to display.</p>;
  }

  const contentSections = sections.filter(
    (section) => section.type === 'text_block' && section.content
  );

  if (contentSections.length === 0) {
    return <p>No viewable content found in sections.</p>;
  }

  const isHtml = (str) => /^\s*<[a-z][\s\S]*>/i.test(str);

  return (
    <div className="section-renderer">
      {contentSections.map((section, index) => {
        const htmlContent = isHtml(section.content)
          ? section.content
          : marked(section.content);

        return (
          <div
            key={index}
            className="content-section"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      })}
    </div>
  );
}

export default SectionRenderer;
