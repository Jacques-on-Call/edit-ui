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
      className="p-3 m-2 bg-white border border-gray-300 rounded-lg cursor-grab hover:bg-gray-100 hover:shadow-md transition-all text-center"
    >
      {name}
    </div>
  );
};

export const Toolbox = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-2">
        <DraggableItem component={<EditorSection />} name="Section" />
        <DraggableItem component={<EditorHero />} name="Hero" />
        <DraggableItem component={<EditorFeatureGrid />} name="Features" />
        <DraggableItem component={<EditorTestimonial />} name="Testimonial" />
        <DraggableItem component={<EditorCTA />} name="CTA" />
        <DraggableItem component={<EditorFooter />} name="Footer" />
      </div>
    </div>
  );
};