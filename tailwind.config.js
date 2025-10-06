import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bark-blue': '#003971',
        'light-grey': '#F5F5F5',
      },
    },
  },
  plugins: [
    typography,
    forms,
  ],
}