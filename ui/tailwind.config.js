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
        // Design tokens strictly per PRD §9
        bg: '#0B0D12',
        surface: '#11141B',
        raised: '#171B24',
        line: '#232833',
        text: '#E6E9EF',
        muted: '#8A93A6',
        accent: '#4C9AFF',
        done: '#3FB68B',
        missed: '#D9666B',
        warn: '#D9A441',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
      }
    },
  },
  plugins: [],
}
