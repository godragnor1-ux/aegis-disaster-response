/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          950: '#070b12',
          900: '#0b1320',
          850: '#0f1b2d',
          800: '#14243b',
          700: '#1e3556',
          600: '#2a4b78',
          accent: '#00f0ff',
          alert: '#ff003c',
          warning: '#ffb703',
          success: '#00e676',
          purple: '#b5179e',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'radar-slow': 'radar-sweep 8s linear infinite',
        'beacon-ping': 'beacon-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 15px rgba(255, 0, 60, 0.6)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)', boxShadow: '0 0 30px rgba(255, 0, 60, 0.9)' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'beacon-ping': {
          '75%, 100%': { transform: 'scale(2.5)', opacity: '0' },
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
