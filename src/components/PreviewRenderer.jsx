import React from 'react';

// Placeholder components for different section types.

const HeroSection = ({ title, subtitle }) => (
  <div className="p-8 text-center bg-gray-100">
    <h1 className="text-4xl font-bold">{title}</h1>
    <p className="text-xl text-gray-600 mt-2">{subtitle}</p>
  </div>
);

const TextSection = ({ heading, content }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold">{heading}</h2>
    <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: content }} />
  </div>
);

const GridSection = ({ heading, items }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4">{heading}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* FIX: Add a guard clause to ensure 'items' is an array before mapping. */}
      {Array.isArray(items) && items.map((item, index) => (
        <div key={index} className="border p-4 rounded-lg">
          <h3 className="font-bold">{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const FallbackSection = ({ section }) => (
  <div className="p-8 bg-red-100 border border-red-400 text-red-700">
    <h3 className="font-bold">Unsupported Section Type: "{section.type}"</h3>
    <pre className="mt-2 text-sm bg-red-50 p-2 rounded">
      {JSON.stringify(section, null, 2)}
    </pre>
  </div>
);


function PreviewRenderer({ frontmatter }) {
  if (!frontmatter || !frontmatter.sections || !Array.isArray(frontmatter.sections)) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No sections found in frontmatter to preview.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {frontmatter.sections.map((section, index) => {
        switch (section.type) {
          case 'hero':
            return <HeroSection key={index} {...section.props} />;
          case 'text':
            return <TextSection key={index} {...section.props} />;
          case 'grid':
            return <GridSection key={index} {...section.props} />;
          default:
            return <FallbackSection key={index} section={section} />;
        }
      })}
    </div>
  );
}

export default PreviewRenderer;