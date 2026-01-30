import { h } from 'preact';

export default function StyledImageComponent({ src, alt, width, alignment, nodeKey }) {
  const wrapperStyle = {
    textAlign: alignment,
    // Add margin for left/right alignment to allow text to wrap
    float: alignment === 'left' || alignment === 'right' ? alignment : 'none',
    margin: alignment === 'left' ? '0 1em 0.5em 0' : alignment === 'right' ? '0 0 0.5em 1em' : '0.5em auto',
  };

  const imageStyle = {
    width: width,
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
  };

  // The outer div controls the block-level properties (alignment, float)
  // A clearing div is added after to contain the float.
  return (
    <div style={wrapperStyle} data-lexical-node-key={nodeKey}>
      <img src={src} alt={alt} style={imageStyle} />
    </div>
  );
}
