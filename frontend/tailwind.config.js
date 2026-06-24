/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f9f6',
          100: '#e1f2eb',
          500: '#10b981', // Emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        slate: {
          850: '#1e293b',
          950: '#0f172a',
        },
        accent: {
          gold: '#fbbf24', // Amber/gold accent
          emerald: '#10b981'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
