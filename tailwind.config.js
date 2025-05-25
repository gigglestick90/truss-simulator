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
        // Engineering color palette
        'eng-dark': {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1a1a1a',
          700: '#262626',
          600: '#333333',
          500: '#404040',
        },
        'eng-tension': {
          light: '#ffcccc',
          DEFAULT: '#ff0000',
          dark: '#cc0000',
        },
        'eng-compression': {
          light: '#ccccff',
          DEFAULT: '#0000ff',
          dark: '#0000cc',
        },
        'eng-neutral': '#888888',
        'eng-safe': '#00ff00',
        'eng-caution': '#ffff00',
        'eng-warning': '#ff8800',
        'eng-critical': '#ff0000',
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-down': 'fade-in-down 0.3s ease-out',
        'fade-out-up': 'fade-out-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 0 rgba(255, 0, 0, 0))',
          },
          '50%': {
            opacity: '0.8',
            filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))',
          },
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-out-up': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
        },
      },
      fontFamily: {
        'sans': ['Atkinson Hyperlegible', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}