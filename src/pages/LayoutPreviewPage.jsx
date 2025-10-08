import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Renderer, Frame } from '@craftjs/core';

import { getMockData } from '../utils/mock-data';
import { prepareLayoutForRender } from '../utils/layout-renderer';

// Import all the components that can be rendered
import { Page } from '../components/layout-editor/render/Page';
import { Section } from '../components/layout-editor/render/Section';
import { Hero } from '../components/layout-editor/blocks/Hero';
import { FeatureGrid } from '../components/layout-editor/blocks/FeatureGrid';
import { Testimonial } from '../components/layout-editor/blocks/Testimonial';
import { CTA } from '../components/layout-editor/blocks/CTA';
import { Footer } from '../components/layout-editor/blocks/Footer';


const LayoutPreviewPage = () => {
  const { pageType } = useParams();
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLayout = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/layout-templates?name=${pageType}`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Failed to fetch layout. Status: ${response.status}`);
        }
        const data = await response.json();
        setLayout(data.json_content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [pageType]);

  const mockData = getMockData(pageType);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading preview...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!layout) {
    return <div className="p-8 text-center text-gray-500">No layout found for type '{pageType}'.</div>;
  }

  const renderedLayout = prepareLayoutForRender(layout, mockData, pageType);

  return (
    <Renderer
      resolver={{
        Page,
        Section,
        Hero,
        FeatureGrid,
        Testimonial,
        CTA,
        Footer,
        // Map editor components to their render-only counterparts
        EditorSection: Section,
        EditorHero: Hero,
        EditorFeatureGrid: FeatureGrid,
        EditorTestimonial: Testimonial,
        EditorCTA: CTA,
        EditorFooter: Footer,
      }}
      json={JSON.stringify(renderedLayout)}
      enabled={false} // Read-only mode
    >
      <Frame />
    </Renderer>
  );
};

export default LayoutPreviewPage;