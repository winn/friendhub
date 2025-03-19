/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fun: {
          blue: '#4A90E2',
          azure: '#5BA4FC',
          sky: '#89CFF0',
          mint: '#4ECDC4',
          teal: '#6EE7E7',
          aqua: '#96F2F2',
          yellow: '#FFE66D',
          purple: '#7F7FD5',
          indigo: '#86A8E7',
        },
        primary: {
          50: '#EBF4FF',
          100: '#D6E8FF',
          200: '#B3D1FF',
          300: '#8FBAFF',
          400: '#6BA3FF',
          500: '#4A90E2',
          600: '#3B7AC9',
          700: '#2C64B0',
          800: '#1D4E97',
          900: '#0E387E',
        },
      },
      animation: {
        'bounce-fun': 'bounce-fun 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      boxShadow: {
        'fun': '0 10px 20px rgba(74, 144, 226, 0.1), 0 6px 6px rgba(78, 205, 196, 0.1)',
        'fun-hover': '0 20px 30px rgba(74, 144, 226, 0.15), 0 12px 12px rgba(78, 205, 196, 0.15)',
      },
      borderRadius: {
        'fun': '2rem',
      },
    },
  },
  plugins: [],
};