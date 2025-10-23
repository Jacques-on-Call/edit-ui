import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getPreviewBase, pathToPreviewRoute } from '../previewRoute';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getPreviewBase', () => {
  it('should return the default /preview when no environment variable is set', () => {
    vi.stubEnv('VITE_PREVIEW_BASE_URL', '')
    expect(getPreviewBase()).toBe('/preview');
  });

  it('should return the base URL from the environment variable when set', () => {
    vi.stubEnv('VITE_PREVIEW_BASE_URL', 'https://example.com/previews');
    expect(getPreviewBase()).toBe('https://example.com/previews');
  });

  it('should trim trailing slashes from the environment variable', () => {
    vi.stubEnv('VITE_PREVIEW_BASE_URL', 'https://example.com/previews///');
    expect(getPreviewBase()).toBe('https://example.com/previews');
  });
});

describe('pathToPreviewRoute', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PREVIEW_BASE_URL', '');
  });

  it('should return the base path for non-page files', () => {
    expect(pathToPreviewRoute('src/components/Header.astro')).toBe('/preview/');
  });

  it('should handle the root index.astro file', () => {
    expect(pathToPreviewRoute('src/pages/index.astro')).toBe('/preview/');
  });

  it('should handle a simple page file', () => {
    expect(pathToPreviewRoute('src/pages/about.astro')).toBe('/preview/about');
  });

  it('should handle a nested index.md file', () => {
    expect(pathToPreviewRoute('src/pages/blog/index.md')).toBe('/preview/blog/');
  });

  it('should preserve the case of the path', () => {
    expect(pathToPreviewRoute('src/pages/Discover/Intro.md')).toBe('/preview/Discover/Intro');
  });

  it('should handle filenames with spaces', () => {
    expect(pathToPreviewRoute('src/pages/My Page.astro')).toBe('/preview/My%20Page');
  });

  it('should handle filenames with special characters', () => {
    // Note: '!' is a valid URI character and is not encoded by encodeURIComponent
    expect(pathToPreviewRoute('src/pages/posts/hello-world-1!.md')).toBe('/preview/posts/hello-world-1!');
  });
});
