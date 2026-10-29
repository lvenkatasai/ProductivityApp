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
        // True-black flat direction: ground, one lightness step to cards, one more to rows.
        bg: '#0C0D0F',
        surface: '#101113',
        raised: '#16171A',
        nested: '#2A2A2A',
        line: '#1E1F22',
        text: '#FFFFFF',
        muted: '#B4B4B4',
        faint: '#949494',
        // Lime is the single data hue; it is also the positive colour. It never touches buttons, tabs or nav.
        accent: '#C6F24E',
        done: '#C6F24E',
        missed: '#E5566F',
        warn: '#E5A93B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '20px',
        sm: '10px',
        md: '14px',
      }
    },
  },
  plugins: [],
}
