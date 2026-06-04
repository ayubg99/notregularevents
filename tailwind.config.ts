import type { Config } from 'tailwindcss'

// NOTE: This project uses Tailwind CSS v4 (CSS-first configuration).
// The active design tokens live in src/app/globals.css via @theme.
// This file exists for:
//   1. IDE autocomplete / IntelliSense
//   2. v3 compatibility tooling
//   3. @config "./tailwind.config.ts" compat mode (if ever needed)
// Class names generated here mirror the @theme tokens exactly.
const config: Config = {
  darkMode: 'class',
  // v4 auto-detects content — explicit paths for edge cases
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B00',
          accent:  '#E91E8C',
          dark:    '#0D0D0D',
          light:   '#FFFFFF',
          purple:  '#8B1A6B',
          success: '#2ECC71',
        },
      },
      fontFamily: {
        heading: ['"Barlow"', '"Clash Display"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:    ['Inter',   'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.5s ease-in-out both',
        'slide-up': 'slideUp 0.5s ease-out both',
        'float':    'float 3s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #FF6B00 0%, #E91E8C 100%)',
        'gradient-dark':    'linear-gradient(135deg, #0D0D0D 0%, #1A0A14 100%)',
        'gradient-vibrant': 'linear-gradient(135deg, #FF6B00 0%, #E91E8C 100%)',
      },
      boxShadow: {
        'brand-sm':   '0 2px 12px rgba(255, 107, 0, 0.25)',
        'brand-md':   '0 4px 24px rgba(255, 107, 0, 0.35)',
        'brand-lg':   '0 8px 40px rgba(255, 107, 0, 0.45)',
        'glow-brand': '0 0 20px rgba(139, 26, 107, 0.40)',
      },
    },
  },
  plugins: [],
}

export default config
