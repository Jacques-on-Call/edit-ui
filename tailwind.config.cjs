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
        'gradient-start': '#000030',
      },
      boxShadow: {
        'cta': '-4px 4px 0px #D8F21D',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 0.5 },
        }
      },
      animation: {
        pulse: 'pulse 6s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
