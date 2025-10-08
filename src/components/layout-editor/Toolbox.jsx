import React from 'react';
import { useEditor } from '@craftjs/core';
import { EditorSection } from './Section.editor';
import { EditorHero } from './blocks/Hero.editor';
import { EditorFeatureGrid } from './blocks/FeatureGrid.editor';
import { EditorTestimonial } from './blocks/Testimonial.editor';
import { EditorCTA } from './blocks/CTA.editor';
import { EditorFooter } from './blocks/Footer.editor';

const DraggableItem = ({ component, name }) => {
  const { connectors } = useEditor();
  return (
    <div
      ref={(ref) => connectors.create(ref, component)}
      className="p-2 border rounded-md bg-white cursor-grab text-center text-sm"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }} // Prevents text selection on drag
    >
      {name}
    </div>
  );
};

export const Toolbox = () => {
  return (
    <div className="flex space-x-2 overflow-x-auto py-1">
      <DraggableItem component={<EditorSection />} name="Section" />
      <DraggableItem component={<EditorHero />} name="Hero" />
      <DraggableItem component={<EditorFeatureGrid />} name="Features" />
      <DraggableItem component={<EditorTestimonial />} name="Testimonial" />
      <DraggableItem component={<EditorCTA />} name="CTA" />
      <DraggableItem component={<EditorFooter />} name="Footer" />
    </div>
  );
};