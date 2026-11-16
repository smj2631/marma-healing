/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sand: { 50: '#fdfaf4', 100: '#f8f1e4', 200: '#efe2c9', 300: '#e3cfa8' },
        teal: { 950: '#0c2a2e', 900: '#123a3f', 800: '#1a4c52', 700: '#22616a', 600: '#2d7a84', 400: '#6fb3b8', 200: '#bfe0e0' },
        saffron: { 300: '#ffd27a', 400: '#ffbf47', 500: '#f4a226', 600: '#d9861a' },
        night: { 950: '#0a0f14', 900: '#111a21', 800: '#1a2630', 700: '#253541' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: { glow: '0 0 24px rgba(244,162,38,0.45)' },
    },
  },
  plugins: [],
};
