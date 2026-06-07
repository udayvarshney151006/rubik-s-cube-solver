/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom neon colors for a premium dark mode theme
        cube: {
          white: '#ffffff',
          yellow: '#ffeb3b',
          green: '#4caf50',
          blue: '#2196f3',
          red: '#f44336',
          orange: '#ff9800',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        neon: '0 0 15px rgba(33, 150, 243, 0.5)',
      }
    },
  },
  plugins: [],
}
