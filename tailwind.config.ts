import type { Config } from 'tailwindcss'

const config: Config = {
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
          500: '#c84b8a',
          600: '#a8376e',
          700: '#8b2559',
        },
      },
    },
  },
  plugins: [],
}

export default config
