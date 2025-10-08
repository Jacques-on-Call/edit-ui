import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { ColorControl } from '../settings/ColorControl';
import { SpacingControl } from '../settings/SpacingControl';
import { BoundInput } from '../settings/BoundInput';
import { BindingPopover } from '../settings/BindingPopover';
import { useEditorContext } from '../EditorContext';
import { getSchemaForType } from '../../../utils/content-schemas';

export const HeroSettings = () => {
  const {
    actions: { setProp },
    title,
    subtitle,
  } = useNode((node) => ({
    title: node.data.props.title,
    subtitle: node.data.props.subtitle,
  }));

  const { pageType } = useEditorContext();
  const schema = getSchemaForType(pageType);

  const [popoverState, setPopoverState] = useState({ open: false, targetProp: null });

  const handleBindClick = (targetProp) => {
    setPopoverState({ open: true, targetProp });
  };

  const handleSelectBinding = (token) => {
    if (popoverState.targetProp) {
      setProp((props) => (props[popoverState.targetProp] = token));
    }
  };

  return (
    <>
      <div className="p-4 space-y-4">
        <BoundInput
          label="Title"
          value={title}
          onChange={(e) => setProp((props) => (props.title = e.target.value), 500)}
          onBind={() => handleBindClick('title')}
        />
        <BoundInput
          as="textarea"
          label="Subtitle"
          value={subtitle}
          onChange={(e) => setProp((props) => (props.subtitle = e.target.value), 500)}
          onBind={() => handleBindClick('subtitle')}
          rows="3"
        />
        <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
          <h3 className="text-md font-medium text-gray-800">Styling</h3>
          <ColorControl propKey="backgroundColor" label="Background" />
          <SpacingControl propKey="padding" label="Padding" />
        </div>
      </div>
      {popoverState.open && (
        <BindingPopover
          schema={schema}
          onSelect={handleSelectBinding}
          onClose={() => setPopoverState({ open: false, targetProp: null })}
        />
      )}
    </>
  );
};