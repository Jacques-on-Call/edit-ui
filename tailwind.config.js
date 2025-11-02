// easy-seo/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'midnight-blue': '#191970',
        'yellow-green': '#D8F21D',
        'light-grey': '#D9D9D9',
        primary: '#191970',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: '#A9A9A9',
        accent: '#008080',
        success: '#32CD32',
        error: '#FF4500',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
