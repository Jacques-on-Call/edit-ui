import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreviewBase, pathToPreviewRoute } from '../previewRoute';

// Correctly mock import.meta.env for Vitest
beforeEach(() => {
  vi.stubGlobal('import', {
    meta: {
      env: {
        VITE_PREVIEW_BASE_URL: '',
      },
    },
  });
});

describe('pathToPreviewRoute', () => {
  it('should return the base path for a non-page file', () => {
    expect(pathToPreviewRoute('src/components/Header.astro')).toBe('/preview/');
  });

  it('should handle the root index.astro file', () => {
    expect(pathToPreviewRoute('src/pages/index.astro')).toBe('/preview/');
  });

  it('should handle a simple page file', () => {
    expect(pathToPreviewRoute('src/pages/about.astro')).toBe('/preview/about');
  });

  it('should handle a nested page file', () => {
    expect(pathToPreviewRoute('src/pages/blog/my-post.md')).toBe('/preview/blog/my-post');
  });

  it('should handle a nested index.md file', () => {
    expect(pathToPreviewRoute('src/pages/blog/index.md')).toBe('/preview/blog');
  });

  it('should preserve casing', () => {
    expect(pathToPreviewRoute('src/pages/Discover/Intro.md')).toBe('/preview/Discover/Intro');
  });

  it('should handle filenames with spaces (although slugs usually prevent this)', () => {
    expect(pathToPreviewRoute('src/pages/my page.astro')).toBe('/preview/my page');
  });

  it('should return base for null or undefined input', () => {
    expect(pathToPreviewRoute(null)).toBe('/preview/');
    expect(pathToPreviewRoute(undefined)).toBe('/preview/');
  });
});

describe('getPreviewBase', () => {
    it('should return the default /preview when env is not set', () => {
        import.meta.env.VITE_PREVIEW_BASE_URL = '';
        expect(getPreviewBase()).toBe('/preview');
    });

    it('should return the value from env variable if set', () => {
        import.meta.env.VITE_PREVIEW_BASE_URL = 'https://my-preview-site.com/previews';
        expect(getPreviewBase()).toBe('https://my-preview-site.com/previews');
    });

    it('should trim trailing slashes from the env variable', () => {
        import.meta.env.VITE_PREVIEW_BASE_URL = 'https://example.com/test//';
        expect(getPreviewBase()).toBe('https://example.com/test');
    });
});
