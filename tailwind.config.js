/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa', 100: '#dae4f2', 200: '#b6c9e5', 300: '#8aa6d1',
          400: '#5a7fbd', 500: '#3a5fa0', 600: '#2b4a82', 700: '#1f3866',
          800: '#152a4d', 900: '#0d1d3d', 950: '#081229',
        },
        accent: {
          50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
          400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
          800: '#155e75', 900: '#164e63',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
