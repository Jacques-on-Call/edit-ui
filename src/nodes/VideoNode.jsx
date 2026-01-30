import { DecoratorNode } from 'lexical';
import { h } from 'preact';

// Simple Preact component to render the video iframe
const VideoComponent = ({ src }) => {
  // Basic URL check to embed YouTube/Vimeo correctly
  let embedSrc = src;
  try {
    const url = new URL(src);
    if (url.hostname === 'youtu.be') {
      embedSrc = `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    } else if (url.hostname === 'www.youtube.com' && url.searchParams.has('v')) {
      embedSrc = `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
    } else if (url.hostname === 'vimeo.com') {
      embedSrc = `https://player.vimeo.com/video/${url.pathname.slice(1)}`;
    }
  } catch (e) {
    // If URL parsing fails, use the original src.
    // This might not work for all video types but is a safe fallback.
    console.warn(`Could not parse video URL: ${src}`, e);
  }

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
      <iframe
        src={embedSrc}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title="Embedded video"
      />
    </div>
  );
};

export class VideoNode extends DecoratorNode {
  __src;

  static getType() {
    return 'video';
  }

  static clone(node) {
    return new VideoNode(node.__src, node.__key);
  }

  static importJSON(serializedNode) {
    return $createVideoNode(serializedNode.src);
  }

  constructor(src, key) {
    super(key);
    this.__src = src;
  }

  exportJSON() {
    return {
      type: 'video',
      version: 1,
      src: this.__src,
    };
  }

  createDOM(config) {
    const span = document.createElement('span');
    // You can add a theme class for videos if you want
    // const className = config.theme.video;
    // if (className) span.className = className;
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <VideoComponent src={this.__src} />;
  }
}

export function $createVideoNode(src) {
  return new VideoNode(src);
}

export function $isVideoNode(node) {
  return node instanceof VideoNode;
}
