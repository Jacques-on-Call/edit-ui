// easy-seo/src/utils/lexicalToHtml.test.js

import assert from 'node:assert';
import { lexicalToHtml } from './lexicalToHtml.js';

// Test case 1: Smart Quote Normalization (BUG-001-251230)
const lexicalStateWithSmartQuotes = {
  root: {
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'Here are some ‘smart single’ and “smart double” quotes.',
          },
        ],
      },
    ],
  },
};

const expectedHtmlWithNormalQuotes = `<p>Here are some 'smart single' and "smart double" quotes.</p>`;
const actualHtml = lexicalToHtml(lexicalStateWithSmartQuotes);

assert.strictEqual(actualHtml, expectedHtmlWithNormalQuotes, 'Test Case 1 Failed: Smart quotes were not normalized correctly.');

console.log('Test Case 1 Passed: Smart quotes normalized successfully.');

// Test case 2: Bold and Italic Formatting
const lexicalStateWithFormatting = {
  root: {
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'This is ' },
          { type: 'text', text: 'bold', format: 1 },
          { type: 'text', text: ' and this is ' },
          { type: 'text', text: 'italic', format: 2 },
          { type: 'text', text: '.' },
        ],
      },
    ],
  },
};

const expectedHtmlWithFormatting = `<p>This is <strong>bold</strong> and this is <em>italic</em>.</p>`;
const actualHtmlWithFormatting = lexicalToHtml(lexicalStateWithFormatting);

assert.strictEqual(actualHtmlWithFormatting, expectedHtmlWithFormatting, 'Test Case 2 Failed: Formatting was not applied correctly.');

console.log('Test Case 2 Passed: Bold and Italic formatting applied successfully.');

console.log('All tests for lexicalToHtml.js passed!');
