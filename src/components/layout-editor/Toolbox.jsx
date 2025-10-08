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
      className="p-3 bg-white border border-gray-300 rounded-lg cursor-grab hover:bg-gray-100 hover:shadow-md transition-all text-center flex-shrink-0 w-28 md:w-auto"
    >
      {name}
    </div>
  );
};

export const Toolbox = () => {
  return (
    <div className="p-2 md:p-4">
      <div className="flex space-x-2 overflow-x-auto md:grid md:grid-cols-2 md:gap-2 md:space-x-0">
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