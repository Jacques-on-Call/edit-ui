/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        black: '#000000',
        blue: '#003971',
        green: '#006300',
        'light-green': '#C7EA46',
        scarlet: '#FF2400',
        'dark-scarlet': '#dc3545',
        grey: '#5a5454',
        'light-grey': '#F5F5F5',
        'dark-grey': '#333333',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}