import { describe, it, expect } from 'vitest';
import { pathToPreviewRoute } from '../previewRoute';

describe('pathToPreviewRoute', () => {
  it('should handle the root index page', () => {
    expect(pathToPreviewRoute('src/pages/index.astro')).toBe('/preview/');
  });

  it('should handle a simple page', () => {
    expect(pathToPreviewRoute('src/pages/about.astro')).toBe('/preview/about');
  });

  it('should handle a nested page', () => {
    expect(pathToPreviewRoute('src/pages/blog/my-post.md')).toBe('/preview/blog/my-post');
  });

  it('should handle a nested index page', () => {
    expect(pathToPreviewRoute('src/pages/blog/index.mdx')).toBe('/preview/blog/');
  });

  it('should handle paths with spaces', () => {
    expect(pathToPreviewRoute('src/pages/my folder/my page.astro')).toBe('/preview/my%20folder/my%20page');
  });

  it('should handle paths with special characters', () => {
    expect(pathToPreviewRoute('src/pages/s!@#$/p^&*.astro')).toBe('/preview/s!%40%23%24/p%5E%26*');
  });

  it('should avoid double slashes', () => {
    // This also tests that the base path is handled correctly
    expect(pathToPreviewRoute('src/pages//about.astro')).toBe('/preview/about');
  });

  it('should handle an empty path', () => {
    expect(pathToPreviewRoute('')).toBe('/preview/');
  });

  it('should handle a null path', () => {
    expect(pathToPreviewRoute(null)).toBe('/preview/');
  });

  it('should handle a path that is not in src/pages', () => {
    expect(pathToPreviewRoute('src/layouts/main.astro')).toBe('/preview/');
  });
});
