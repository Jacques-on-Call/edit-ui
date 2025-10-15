import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';

// Import the necessary components
import { Toolbox } from './Toolbox';
import { Page } from './render/Page';
import { EditorHero } from './blocks/Hero.editor';
import { Text } from './blocks/Text.editor';
import { EditorSection } from './Section.editor';

// This is the editor for Milestone 2.
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
      // Re-enable the editor UI so we can interact with it.
      enabled={true}
    >
      <div className="flex flex-col h-screen w-full bg-gray-100">
        <header className="bg-white shadow-md p-4 z-10">
          <h1 className="text-xl font-bold text-gray-800">Milestone 2: Toolbox Interaction</h1>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className="craftjs-renderer flex-1 overflow-auto relative">
            <Frame>
              <Element is={Page} canvas>
                  <h1 className="text-2xl font-bold p-4">Click "Add Hero" in the toolbox.</h1>
                  <p className="p-4">A new Hero component should appear below.</p>
              </Element>
            </Frame>
          </div>
          <div className="w-96 bg-gray-50 border-l">
            <Toolbox />
          </div>
        </div>
      </div>
    </Editor>
  );
};