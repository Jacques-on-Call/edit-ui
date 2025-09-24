import React from 'react';

// Define more visually representative placeholder components
const Hero = ({ heading, text }) => (
  <div style={{
    padding: '40px 20px',
    margin: '10px 0',
    borderRadius: '8px',
    backgroundColor: '#005A9E', // A deep blue, common for heroes
    color: 'white',
    textAlign: 'center',
  }}>
    <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0' }}>{heading}</h1>
    <p style={{ fontSize: '1.2rem', margin: 0 }}>{text}</p>
  </div>
);

const Feature = ({ heading, text }) => (
  <div style={{
    padding: '20px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  }}>
    <h2 style={{ fontSize: '1.5rem', margin: '0 0 10px 0', color: '#333' }}>{heading}</h2>
    <p style={{ fontSize: '1rem', margin: 0, color: '#555' }}>{text}</p>
  </div>
);

// This component map allows us to dynamically render sections
const components = {
  hero: Hero,
  feature: Feature,
  // Future section components can be added here
};

const ContentRenderer = ({ content }) => {
  if (!content || !Array.isArray(content)) {
    return <p style={{ color: '#777', padding: '20px' }}>No content available to display.</p>;
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '10px' }}>
      {content.map((block, index) => {
        const Component = components[block.type];
        if (!Component) {
          // Log a warning for developers if a component is missing
          console.warn(`No component found for section type: ${block.type}`);
          return (
            <div key={index} style={{ border: '1px dashed red', padding: '10px', margin: '10px 0' }}>
              <p><strong>Unknown Section Type:</strong> {block.type}</p>
              <pre>{JSON.stringify(block, null, 2)}</pre>
            </div>
          );
        }
        // Render the appropriate component with its data
        return <Component key={`${block.type}-${index}`} {...block} />;
      })}
    </div>
  );
};

export default ContentRenderer;