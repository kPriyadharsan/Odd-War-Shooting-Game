/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        paper: {
          light: '#FFFDF9',
          DEFAULT: '#F8F4EB',
          card: '#FCFAF3',
          dark: '#EFE8DA',
          rule: '#E5DFD3',
          margin: '#F0A8A8',
        },
        pencil: {
          graphite: '#23252A',
          grey: '#5C6069',
          light: '#8E949F',
          border: '#D5CFC3',
          borderDark: '#9C9486',
        },
        ink: {
          red: '#CE4242',
          blue: '#2B68B4',
          green: '#2E8557',
          yellow: '#D59926',
          charcoal: '#242730',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        handwriting: ['"Patrick Hand"', 'cursive', 'sans-serif'],
        display: ['"Patrick Hand"', 'cursive', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(35, 37, 42, 0.05), 0 10px 20px -5px rgba(35, 37, 42, 0.04)',
        'paper-lg': '0 4px 6px -1px rgba(35, 37, 42, 0.06), 0 20px 25px -5px rgba(35, 37, 42, 0.07)',
        'sketch': '2px 2px 0px #D5CFC3',
        'sketch-sm': '1px 1px 0px #D5CFC3',
        'sketch-dark': '2px 2px 0px #23252A',
        'sketch-md': '3px 3px 0px #23252A',
        'sketch-pressed': '0px 0px 0px #23252A',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.18s ease-out forwards',
      },
    },
  },
  plugins: [],
}
