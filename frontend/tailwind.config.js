/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F17',
          card: '#151D2A',
          border: '#232E42',
          text: '#F1F5F9',
          muted: '#94A3B8',
        },
        brand: {
          50: '#EEF2FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          accent: '#06B6D4',
        }
      }
    },
  },
  plugins: [],
}
