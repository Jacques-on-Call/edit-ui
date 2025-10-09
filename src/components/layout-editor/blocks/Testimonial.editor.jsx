import React from 'react';
import { useNode } from '@craftjs/core';
import { Testimonial } from './Testimonial';
import { TestimonialSettings } from './TestimonialSettings';

export const EditorTestimonial = (props) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div ref={(ref) => connect(drag(ref))}>
      <Testimonial {...props} />
    </div>
  );
};

EditorTestimonial.craft = {
  displayName: 'Testimonial',
  props: {
    quote: 'This is an amazing product. It has changed my life for the better and I cannot imagine working without it.',
    author: 'Jane Doe',
    title: 'CEO, Example Inc.',
    style: {
      paddingTop: '48px',
      paddingBottom: '48px',
      backgroundColor: '#f9fafb',
    },
  },
  related: {
    settings: TestimonialSettings,
  },
};