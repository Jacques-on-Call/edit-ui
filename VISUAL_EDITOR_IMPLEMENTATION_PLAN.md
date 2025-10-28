# Technical Implementation Plan: Visual Editor

## Objective
To build a modular, performant, and user-friendly visual editor for the `easy-seo` application. This document outlines the core architecture, data structures, component interactions, and a phased implementation roadmap.

## 1. Core Architecture

*   **Editing Paradigm**: A dual-pane system featuring an interactive "Layout Editor" and a sandboxed "Live Preview" in an iframe.
*   **Synchronization**: Communication between the editor and preview will be handled via the `postMessage` API, using the existing `preview-bridge.js`. A structured, versioned message protocol will be established (e.g., `{ type: 'editor:patch', payload: [...] }`).
*   **Persistence**: The canonical source of truth for a page's structure will be a `page.json` file. The `.astro` file will act as a renderer for this JSON structure, ensuring a clean separation of data and presentation.
*   **State Management**: The editor's UI state (e.g., selected component, UI visibility) will be managed by Preact's built-in Context API to avoid new dependencies. A lightweight store facade will be created to abstract state logic.

## 2. Data Structures

### `page.json` Schema
This file will represent the component tree.

*   **Root Node**: The top-level object will contain page-level metadata and a `children` array of component nodes.
*   **Component Node**: Each node in the tree will have the following structure:
    ```json
    {
      "id": "unique-uuid-string",
      "type": "string",
      "properties": {
      },
      "children": []
    }
    ```

### `component-schemas.json` Schema
This file will define the available components for the editor.

*   **Top-level**: The root object will be a dictionary where keys are the component `type` names.
*   **Component Schema Definition**: Each entry will contain:
    ```json
    {
      "category": "string",
      "properties": {
        "propName": {
          "type": "string",
          "default": "defaultValue",
          "label": "User-Friendly Label",
          "options": []
        }
      }
    }
    ```

## 3. Key Components & Logic (High-Level)

*   **`VisualEditorPage.jsx`**: The main container component. It will initialize the state, fetch the `page.json` and schemas, and orchestrate the Layout Editor and Live Preview.
*   **`LayoutEditor.jsx`**:
    *   Renders the component tree from `page.json` as a series of interactive, nested blocks.
    *   Each block will have a transparent background and a colored border for visual identification.
    *   Handles user interactions: click (selection), hover (hierarchy highlighting), and drag-and-drop.
*   **`LivePreview.jsx`**:
    *   An iframe that loads a generic Astro preview page.
    *   Listens for `postMessage` events from the editor and re-renders its content dynamically by mapping the JSON tree to actual Preact components.
*   **Selection Logic**:
    *   A click event will select the innermost component.
    *   Upon selection, a "breadcrumb" UI (e.g., `Section > Column > Button`) will appear, allowing the user to traverse up the hierarchy.
*   **Settings Panel**:
    *   A dynamic panel that renders form controls based on the selected component's schema from `component-schemas.json`.
    *   Changes in the panel will update the central state, triggering a `postMessage` patch to the preview.

## 4. Phased Implementation Plan

### Phase 1: Foundation & Core Editing
1.  Finalize and create the `page.json` and `component-schemas.json` files with initial schemas.
2.  Implement the state management structure using Preact Context.
3.  Build the static UI for `VisualEditorPage.jsx`, including the layout for the editor, preview, palette, and settings panel.
4.  Implement the component palette, dynamically loading items from the schema.
5.  Implement the hierarchy-aware selection logic and visual feedback (bounding boxes, breadcrumbs).
6.  Wire up the settings panel to display and modify the properties of a selected component.

### Phase 2: Preview Synchronization
1.  Integrate the iframe-based `LivePreview.jsx`.
2.  Implement the `postMessage` bridge for sending state patches from the editor to the preview.
3.  Build the rendering logic inside the preview to dynamically display the component tree.

### Phase 3: Advanced Features & Polish
1.  Implement drag-and-drop reordering.
2.  Add resize handles.
3.  Implement an undo/redo command stack.
