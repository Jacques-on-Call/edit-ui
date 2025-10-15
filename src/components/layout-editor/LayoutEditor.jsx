import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';

// Only import the components absolutely necessary for the canvas itself.
import { Page } from './render/Page';
import { EditorHero } from './blocks/Hero.editor';
import { Text } from './blocks/Text.editor';
import { EditorSection } from './Section.editor';

// This is the "scorched earth" simplified Layout Editor for Milestone 1.
// Its only job is to prove that a single component can be rendered on the canvas.
export const LayoutEditor = () => {
  return (
    <Editor
      // Register the components that can be rendered.
      resolver={{
        EditorHero,
        Page,
        Text,
        EditorSection
      }}
      // Disable the editor UI (sidebar, toolbars, etc.) as we are not using them.
      enabled={false}
    >
      <div className="flex flex-col h-screen w-full bg-gray-100">
        <header className="bg-white shadow-md p-4 z-10">
          <h1 className="text-xl font-bold text-gray-800">Milestone 1: Single Component on Canvas</h1>
        </header>
        <div className="flex-1 overflow-auto">
          {/* The Frame is the canvas where components are rendered. */}
          <Frame>
            {/*
              We start with a Page element containing a single, hardcoded Hero component.
              This is not editable, just for display, per the "scorched earth" plan.
            */}
            <Element is={Page} canvas>
                <EditorHero
                    title="Proof of Concept"
                    subtitle="This Hero component is rendered on the canvas."
                />
            </Element>
          </Frame>
        </div>
      </div>
    </Editor>
  );
};