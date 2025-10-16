import React, { useState, useRef } from 'react';

// Component Types
const Section = ({ children }) => <div className="section">{children}</div>;
const Hero = ({ text }) => <h1 className="hero">{text}</h1>;
const TextBlock = ({ text }) => <p className="text-block">{text}</p>;
const ImagePlaceholder = () => <div className="image-placeholder">Image Placeholder</div>;

const SimpleMobileLayoutEditor = () => {
    const [components, setComponents] = useState([]);
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [ghostElement, setGhostElement] = useState(null);
    const touchStartY = useRef(0);
    const dragThreshold = 10;

    const handleTouchStart = (index, e) => {
        touchStartY.current = e.touches[0].clientY;
        setDraggingIndex(index);
        setIsDragging(true);
        setGhostElement(e.currentTarget.cloneNode(true));
    };

    const handleTouchMove = (e) => {
        if (!isDragging || draggingIndex === null) return;

        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY.current;

        if (Math.abs(deltaY) > dragThreshold) {
            // Update ghost element position
            const ghost = ghostElement;
            ghost.style.position = 'absolute';
            ghost.style.top = `${touchY}px`;
            document.body.appendChild(ghost);
        }
    };

    const handleTouchEnd = () => {
        // Logic to drop the component and update state
        setIsDragging(false);
        setDraggingIndex(null);
        setGhostElement(null);
        // Remove ghost from DOM
        if (ghostElement) {
            document.body.removeChild(ghostElement);
        }
    };

    const addComponent = (type) => {
        const newComponent = { type, id: Date.now() };
        setComponents([...components, newComponent]);
    };

    const renderComponent = (component) => {
        switch (component.type) {
            case 'section':
                return <Section>{components.map(renderComponent)}</Section>;
            case 'hero':
                return <Hero text="Hero Title" />;
            case 'textBlock':
                return <TextBlock text="Some text content" />;
            case 'imagePlaceholder':
                return <ImagePlaceholder />;
            default:
                return null;
        }
    };

    return (
        <div className="layout-editor" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {components.map((component, index) => (
                <div key={component.id}
                     onTouchStart={(e) => handleTouchStart(index, e)}
                     className="component">
                    {renderComponent(component)}
                </div>
            ))}
            <button onClick={() => addComponent('hero')}>Add Hero</button>
            <button onClick={() => addComponent('textBlock')}>Add TextBlock</button>
            <button onClick={() => addComponent('imagePlaceholder')}>Add Image</button>
        </div>
    );
};

export default SimpleMobileLayoutEditor;