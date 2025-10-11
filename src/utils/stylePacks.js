/**
 * @file Visual DNA System - Style Packs
 * @description Defines pre-made modern themes for the layout editor.
 * Each theme is a collection of CSS variables that can be injected into the preview.
 */

export const stylePacks = {
  'soft-neo': {
    name: 'Soft Neo',
    description: 'Rounded glassmorphism, soft shadows, and gradients. Inspired by Apple-style, Gen Z UI.',
    variables: {
      '--theme-bg': '#f1f5f9',
      '--theme-text': '#0f172a',
      '--theme-primary': '#6366f1',
      '--theme-accent': '#ec4899',
      '--theme-card-bg': 'rgba(255, 255, 255, 0.5)',
      '--theme-card-border': 'rgba(255, 255, 255, 0.8)',
      '--theme-button-radius': '9999px',
      '--theme-shadow': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    }
  },
  'cyber-grid': {
    name: 'Cyber Grid',
    description: 'Dark with bright accents and motion. An AI/tech aesthetic.',
    variables: {
      '--theme-bg': '#0f172a',
      '--theme-text': '#e2e8f0',
      '--theme-primary': '#22d3ee',
      '--theme-accent': '#f472b6',
      '--theme-card-bg': 'rgba(30, 41, 59, 0.5)',
      '--theme-card-border': 'rgba(51, 65, 85, 1)',
      '--theme-button-radius': '4px',
      '--theme-shadow': '0 0 15px rgba(34, 211, 238, 0.3)',
    }
  },
  // A neutral base theme to fall back on
  'base': {
      name: 'Base',
      description: 'A neutral, unstyled theme for fallbacks.',
      variables: {
        '--theme-bg': '#ffffff',
        '--theme-text': '#111827',
        '--theme-primary': '#007bff',
        '--theme-accent': '#6c757d',
        '--theme-card-bg': '#f8f9fa',
        '--theme-card-border': '#dee2e6',
        '--theme-button-radius': '0.25rem',
        '--theme-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }
  }
};