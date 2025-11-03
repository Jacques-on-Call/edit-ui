/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Quicksand"', 'sans-serif'],
      },
      colors: {
        'midnight-blue': '#191970',
        'accent-lime': '#D8F21D',
        'muted-text': '#D9D9D9',
        'main-text': '#FFFFFF',
        'button-bg': '#000000',
        'button-text': '#FFFFFF',
      },
      translate: {
        'press': '2px',
      }
    },
  },
  plugins: [],
}
