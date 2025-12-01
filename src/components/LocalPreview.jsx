import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from '../contexts/AuthContext';
import { getPreviewImageUrl } from '../lib/imageHelpers';

/**
 * LocalPreview Component
 * 
 * Renders content locally using the same structure as Astro components
 * for instant feedback before syncing to GitHub. No build required.
 */

// Hero section preview
const HeroPreview = ({ title, subtitle, body, featureImage, featureImageUrl, featureImageAlt, backgroundImageUrl, repoFullName }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getPreviewImageUrl(featureImage || featureImageUrl, repoFullName);
  const bgUrl = getPreviewImageUrl(backgroundImageUrl, repoFullName);

  const containerStyle = bgUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};

  return (
    <section class="relative py-16 bg-gray-900" style={containerStyle}>
      <div class="container mx-auto px-4 max-w-4xl">
        {imageUrl && !imageError && (
          <img 
            src={imageUrl} 
            alt={featureImageAlt || title || 'Feature image'} 
            class="w-full h-64 object-cover rounded-lg mb-6"
            onError={() => setImageError(true)}
          />
        )}
        {title && (
          <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4" dangerouslySetInnerHTML={{ __html: title }} />
        )}
        {subtitle && (
          <p class="text-xl text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: subtitle }} />
        )}
        {body && (
          <div class="text-lg text-gray-400 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
        )}
      </div>
    </section>
  );
};

// Text section preview
const TextPreview = ({ title, body, headerImageUrl, featureImage, headerImageAlt, repoFullName }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getPreviewImageUrl(headerImageUrl || featureImage, repoFullName);

  return (
    <section class="py-12 bg-gray-800">
      <div class="container mx-auto px-4 max-w-4xl">
        {imageUrl && !imageError && (
          <img 
            src={imageUrl} 
            alt={headerImageAlt || title || 'Section image'} 
            class="w-full h-48 object-cover rounded-lg mb-6"
            onError={() => setImageError(true)}
          />
        )}
        {title && (
          <h2 class="text-3xl font-bold text-white mb-4" dangerouslySetInnerHTML={{ __html: title }} />
        )}
        {body && (
          <div class="text-lg text-gray-300 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
        )}
      </div>
    </section>
  );
};

// Footer preview
const FooterPreview = ({ content }) => {
  return (
    <footer class="py-8 bg-gray-950 text-center">
      <div class="container mx-auto px-4">
        {content ? (
          <div class="text-gray-400" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p class="text-gray-500">Footer content</p>
        )}
      </div>
    </footer>
  );
};

// Unknown section fallback
const UnknownSection = ({ type, props }) => {
  return (
    <div class="py-8 bg-red-900/30 border border-red-500/50 m-4 rounded">
      <div class="container mx-auto px-4 text-center">
        <p class="text-red-400 font-semibold">Unknown section type: {type}</p>
        <pre class="text-xs text-gray-500 mt-2 overflow-auto">{JSON.stringify(props, null, 2)}</pre>
      </div>
    </div>
  );
};

export default function LocalPreview({ sections = [], layout = 'default' }) {
  const { selectedRepo } = useAuth();
  const repoFullName = selectedRepo?.full_name;
  const previewRef = useRef(null);

  useEffect(() => {
    // 1. Set --vh custom property for mobile viewport height correction
    const updateVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    updateVh();
    window.addEventListener('resize', updateVh);

    // 2. Observe content height and post message to parent
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const contentHeight = entries[0].target.scrollHeight;
        window.parent.postMessage({ type: 'content-height', height: contentHeight }, '*');
      }
    });

    if (previewRef.current) {
      observer.observe(previewRef.current);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateVh);
      observer.disconnect();
    };
  }, []); // Run only on mount and unmount

  if (!sections || sections.length === 0) {
    return (
      <div class="h-full flex items-center justify-center bg-gray-900">
        <p class="text-gray-500 text-lg">No content to preview</p>
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      class="local-preview bg-gray-900"
      data-layout={layout}
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {sections.map((section, index) => {
        const key = section.id || `section-${index}`;
        const props = { ...section.props, repoFullName };

        switch (section.type) {
          case 'hero':
            return <HeroPreview key={key} {...props} />;
          case 'textSection':
          case 'bodySection':
            return <TextPreview key={key} {...props} />;
          case 'footer':
            return <FooterPreview key={key} {...props} />;
          default:
            return <UnknownSection key={key} type={section.type} props={section.props} />;
        }
      })}
    </div>
  );
}
