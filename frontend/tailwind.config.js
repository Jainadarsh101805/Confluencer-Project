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
        ledger: {
          bg: '#0B0D0E',
          surface: '#131719',
          surface2: '#191E20',
          elevated: '#202629',
          border: '#242D30',
          borderLight: '#323E43',
          text: '#F0F1E9',
          muted: '#929A96',
          dim: '#5A6361',
          lime: '#C7F36B',
          limeHover: '#D5F785',
          limeGlow: 'rgba(199, 243, 107, 0.15)',
          amber: '#F3BD68',
          amberGlow: 'rgba(243, 189, 104, 0.15)',
          coral: '#FF7474',
          coralGlow: 'rgba(255, 116, 116, 0.15)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        editorial: ['"Space Grotesk"', '"Syne"', 'sans-serif'],
      },
      boxShadow: {
        'glow-lime': '0 0 20px -5px rgba(199, 243, 107, 0.3)',
        'glow-coral': '0 0 20px -5px rgba(255, 116, 116, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
