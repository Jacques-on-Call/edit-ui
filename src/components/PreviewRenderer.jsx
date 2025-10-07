import React from 'react';

// --- Reusable Section Components ---

const HeroSection = ({ title, subtitle }) => (
  <div className="p-8 text-center bg-gray-100">
    <h1 className="text-4xl font-bold">{title || 'Hero Title'}</h1>
    {subtitle && <p className="text-xl text-gray-600 mt-2">{subtitle}</p>}
  </div>
);

const TextSection = ({ heading, content }) => (
  <div className="p-8">
    {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
    <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: content || '' }} />
  </div>
);

const GridSection = ({ heading, items }) => (
  <div className="p-8">
    {heading && <h2 className="text-2xl font-bold mb-4">{heading}</h2>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.isArray(items) && items.map((item, index) => (
        <div key={item.id || index} className="border p-4 rounded-lg">
          <h3 className="font-bold">{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const FallbackSection = ({ section }) => (
  <div className="p-8 bg-yellow-50 border border-yellow-300 text-yellow-800">
    <h3 className="font-bold">Unsupported Section Type: "{section.type}"</h3>
    <p className="text-sm mt-1">This section type is not supported by the instant preview.</p>
    <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded">
      {JSON.stringify(section, null, 2)}
    </pre>
  </div>
);

const ErrorSection = ({ section, error }) => (
   <div className="p-4 bg-red-50 border border-red-200 rounded">
    <p className="font-bold text-red-700">Error rendering section: {section.type}</p>
    <p className="text-sm text-red-600 mt-1">{error.message}</p>
  </div>
);

// --- Main Renderer Component ---

function PreviewRenderer({ frontmatter }) {
  if (!frontmatter?.sections || !Array.isArray(frontmatter.sections)) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No sections found in frontmatter to preview.</p>
        <p className="text-sm">Add a 'sections' array to your file's frontmatter to see the instant preview.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {frontmatter.sections.map((section, index) => {
        const sectionKey = section.id || `section-${index}-${section.type}`;

        try {
          switch (section.type) {
            case 'hero':
              return <HeroSection key={sectionKey} {...section.props} />;
            case 'text_block':
              return <TextSection key={sectionKey} {...section.props} />;
            case 'grid':
              return <GridSection key={sectionKey} {...section.props} />;
            default:
              return <FallbackSection key={sectionKey} section={section} />;
          }
        } catch (error) {
          console.error(`Error rendering section ${sectionKey}:`, error);
          return <ErrorSection key={sectionKey} section={section} error={error} />;
        }
      })}
    </div>
  );
}

export default PreviewRenderer;