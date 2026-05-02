/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#e879a8',
          500: '#c84b8a',
          600: '#a8376e',
          700: '#8b2559',
          800: '#6b1b44',
          900: '#4a1230',
          950: '#2d0a1c',
        },
      },
    },
  },
  plugins: [],
}
