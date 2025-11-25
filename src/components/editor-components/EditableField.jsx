import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

export default function EditableField({ value, onChange, placeholder, className }) {
  const elementRef = useRef(null);

  // This effect ensures that if the parent's value changes programmatically
  // (e.g., on initial load), the contentEditable div is updated.
  // We use a guard to prevent this from firing on every user input.
  useEffect(() => {
    if (elementRef.current && value !== elementRef.current.innerHTML) {
      elementRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const newContent = e.currentTarget.innerHTML;
    // Guard against redundant updates that can cause cursor jumps.
    if (value !== newContent) {
      onChange(newContent);
    }
  };

  return (
    <div
      ref={elementRef}
      contentEditable
      onInput={handleInput}
      data-placeholder={placeholder}
      className={`${className} focus:outline-none focus:ring-0 relative cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:pointer-events-none`}
      dangerouslySetInnerHTML={{ __html: value || '' }}
    />
  );
}
