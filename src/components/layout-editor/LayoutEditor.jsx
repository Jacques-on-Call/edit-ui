import React from 'react';
import { Editor, Frame, Element } from '@craftjs/core';

// Import the necessary components
import { Toolbox } from './Toolbox';
import { Page } from './render/Page';
import { EditorHero } from './blocks/Hero.editor';
import { Text } from './blocks/Text.editor';
import { EditorSection } from './Section.editor';

// This is the editor for Milestone 2, now with a mobile-first toolbar.
export const LayoutEditor = () => {
  return (
    <Editor
      resolver={{ EditorHero, Page, Text, EditorSection }}
      enabled={true}
      handlers={(store) => ({
        ...store.handlers,
        onDragStart: (e) => {
          // Prevent default touch behavior
          if (e.touches) {
            e.preventDefault();
          }
        }
      })}
    >
      <div className="flex flex-col h-screen w-full bg-gray-100">
        <header className="bg-white shadow-md p-4 z-10 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800">Milestone 2: Toolbox Interaction</h1>
        </header>
        <div className="flex-1 overflow-auto relative">
          {/* The canvas takes up the main area */}
          <Frame>
            <Element is={Page} canvas>
              <h1 className="text-2xl font-bold p-4">Use the bottom toolbar to add a Hero.</h1>
              <p className="p-4">This layout is designed to be mobile-first.</p>
            </Element>
          </Frame>
        </div>
        {/* The toolbox is now a bottom bar, which is much more mobile-friendly */}
        <div className="flex-shrink-0">
            <Toolbox />
        </div>
      </div>
    </Editor>
  );
};