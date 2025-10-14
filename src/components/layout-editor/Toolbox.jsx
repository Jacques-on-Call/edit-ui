import React from 'react';
import { useEditor } from '@craftjs/core';
import { EditorSection } from './Section.editor';
import { EditorHero } from './blocks/Hero.editor';
import { EditorTestimonial } from './blocks/Testimonial.editor';

const DraggableItem = ({ component, name }) => {
  const { connectors } = useEditor();
  return (
    <div
      ref={(ref) => connectors.create(ref, component)}
      className="p-3 m-2 bg-white border border-gray-300 rounded-lg cursor-grab hover:bg-gray-100 hover:shadow-md transition-all text-center"
      style={{ touchAction: 'none', userSelect: 'none' }}
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
        <DraggableItem component={<EditorTestimonial />} name="Testimonial" />
      </div>
    </div>
  );
};