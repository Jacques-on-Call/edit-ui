import { h } from 'preact';
import { render } from '@testing-library/preact';
import 'vitest-dom/extend-expect';

// Configure Preact for testing
global.h = h;
global.render = render;
