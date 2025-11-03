// easy-seo/tailwind.config.js
import { theme } from './src/themes/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: theme.colors,
    fontFamily: {
      sans: [theme.typography.fontFamily, 'sans-serif'],
    },
  },
  plugins: [],
}
