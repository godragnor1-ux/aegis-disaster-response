/** @type {import('tailwindcss').Config} */
//
// Tokens come from DESIGN.md (Linear design analysis, see frontend/DESIGN.md).
// The legacy `tactical-*` scale is preserved as an alias onto the Linear surface
// ladder so existing call sites (text-tactical-accent, border-tactical-800, …)
// keep resolving, but to promoted tokens — do not add new usages of it.
//
module.exports = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#010102',
        surface: {
          1: '#0f1011',
          2: '#141516',
          3: '#18191a',
          4: '#191a1b',
        },
        hairline: {
          DEFAULT: '#23252a',
          strong: '#34343a',
          tertiary: '#3e3e44',
        },
        ink: {
          DEFAULT: '#f7f8f8',
          muted: '#d0d6e0',
          subtle: '#8a8f98',
          tertiary: '#62666d',
        },
        brand: {
          DEFAULT: '#5e6ad2',
          hover: '#828fff',
          focus: '#5e69d1',
        },
        // derived severity, status only
        severity: {
          critical: '#e5484d',
          warning: '#f5a623',
          ok: '#27a644',
        },
        // legacy alias -> Linear ladder
        tactical: {
          950: '#010102',
          900: '#0f1011',
          850: '#141516',
          800: '#23252a',
          700: '#34343a',
          600: '#3e3e44',
          accent: '#5e6ad2',
          alert: '#e5484d',
          warning: '#f5a623',
          success: '#27a644',
          purple: '#5e6ad2',
        },
      },
      fontFamily: {
        sans: [
          'Linear Text',
          '-apple-system',
          'SF Pro Text',
          'Segoe UI',
          'Inter',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Linear Display',
          '-apple-system',
          'SF Pro Display',
          'Segoe UI',
          'Inter',
          'sans-serif',
        ],
        mono: ['Linear Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // DESIGN.md type scale
        'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-1.8px', fontWeight: '600' }],
        'display-md': ['40px', { lineHeight: '1.15', letterSpacing: '-1.0px', fontWeight: '600' }],
        headline: ['28px', { lineHeight: '1.2', letterSpacing: '-0.6px', fontWeight: '600' }],
        'card-title': ['22px', { lineHeight: '1.25', letterSpacing: '-0.4px', fontWeight: '500' }],
        subhead: ['20px', { lineHeight: '1.4', letterSpacing: '-0.2px' }],
        'body-lg': ['18px', { lineHeight: '1.5' }],
        body: ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
        eyebrow: ['12px', { lineHeight: '1.3', letterSpacing: '0.4px', fontWeight: '500' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '9999px',
      },
      animation: {
        'beacon-ping': 'beacon-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'beacon-ping': {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
