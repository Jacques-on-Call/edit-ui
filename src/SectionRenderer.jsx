import React from 'react';

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

  return (
    <div className="section-renderer">
      {contentSections.map((section, index) => (
        <div
          key={index}
          className="content-section"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      ))}
    </div>
  );
}

export default SectionRenderer;
