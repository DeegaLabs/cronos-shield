/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#0a0e1a',
        'bg-surface': '#1e293b',
        
        // Brand
        primary: {
          DEFAULT: '#6366f1', // indigo-500
          hover: '#4f46e5',   // indigo-600
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          DEFAULT: '#06b6d4', // cyan-500
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        
        // Tool Colors
        'tool-risk': '#4ade80',      // green-400
        'tool-vaults': '#fb923c',    // orange-400
        'tool-cexdex': '#a855f7',    // purple-500
        'tool-observability': '#60a5fa', // blue-400
        
        // Semantic
        success: '#22c55e',   // green-500
        warning: '#f59e0b',   // amber-500
        danger: '#ef4444',    // red-500
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        fadeIn: {
          'to': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
