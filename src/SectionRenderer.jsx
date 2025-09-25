import React from 'react';

// --- Presentational Components for Each Section Type ---

const Hero = ({ heading, text, image, imageAlt }) => (
  <div style={{ padding: '40px 20px', margin: '10px 0', borderRadius: '8px', backgroundColor: '#005A9E', color: 'white', textAlign: 'center' }}>
    {image && <img src={image} alt={imageAlt || ''} style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }} />}
    <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0' }}>{heading}</h1>
    <p style={{ fontSize: '1.2rem', margin: 0 }}>{text}</p>
  </div>
);

const Feature = ({ heading, text }) => (
  <div style={{ padding: '20px', margin: '10px 0', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
    <h2 style={{ fontSize: '1.5rem', margin: '0 0 10px 0', color: '#333' }}>{heading}</h2>
    <p style={{ fontSize: '1rem', margin: 0, color: '#555' }}>{text}</p>
  </div>
);

const TextBlock = ({ content }) => (
  <div
    style={{ padding: '20px', margin: '10px 0' }}
    dangerouslySetInnerHTML={{ __html: content }}
  />
);

// --- Component Map ---

const components = {
  hero: Hero,
  feature: Feature,
  text_block: TextBlock,
};

// --- Main Renderer ---

function SectionRenderer({ sections }) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return <p>This file does not contain any content sections to display.</p>;
  }

  return (
    <div className="section-renderer" style={{ fontFamily: 'sans-serif', padding: '10px' }}>
      {sections.map((section, index) => {
        const Component = components[section.type];
        if (!Component) {
          // Fallback for unknown section types
          return (
            <div key={index} style={{ border: '1px dashed red', padding: '10px', margin: '10px 0' }}>
              <p><strong>Unknown Section Type:</strong> {section.type}</p>
              <pre>{JSON.stringify(section, null, 2)}</pre>
            </div>
          );
        }
        return <Component key={`${section.type}-${index}`} {...section} />;
      })}
    </div>
  );
}

export default SectionRenderer;