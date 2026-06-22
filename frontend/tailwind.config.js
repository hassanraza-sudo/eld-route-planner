/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fleet: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d0ff',
          300: '#99afff',
          400: '#6b83ff',
          500: '#4455ff',
          600: '#2e34f5',
          700: '#2325d8',
          800: '#1f20b0',
          900: '#1f2189',
          950: '#13145a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        road: '#0f1117',
        panel: '#1a1d27',
        card: '#20242f',
        border: '#2a2f3f',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
