/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fun: {
          red: '#FF6B6B',
          coral: '#FF8787',
          pink: '#FFB5B5',
          mint: '#4ECDC4',
          teal: '#6EE7E7',
          aqua: '#96F2F2',
          yellow: '#FFE66D',
          purple: '#7F7FD5',
          blue: '#86A8E7',
        },
        primary: {
          50: '#FFE5E5',
          100: '#FFD1D1',
          200: '#FFB5B5',
          300: '#FF9B9B',
          400: '#FF8787',
          500: '#FF6B6B',
          600: '#FF5252',
          700: '#FF3838',
          800: '#FF1F1F',
          900: '#FF0505',
        },
      },
      animation: {
        'bounce-fun': 'bounce-fun 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      boxShadow: {
        'fun': '0 10px 20px rgba(255, 107, 107, 0.1), 0 6px 6px rgba(78, 205, 196, 0.1)',
        'fun-hover': '0 20px 30px rgba(255, 107, 107, 0.15), 0 12px 12px rgba(78, 205, 196, 0.15)',
      },
      borderRadius: {
        'fun': '2rem',
      },
    },
  },
  plugins: [],
};