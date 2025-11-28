/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard"', '"Roboto Flex"', 'system-ui', 'sans-serif'],
        'primary-kr': ['"Pretendard"', 'sans-serif'],
        'primary-en': ['"Roboto Flex"', 'sans-serif'],
      },
      fontSize: {
        'h1': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'h2': ['20px', { lineHeight: '26px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'h4': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'h5': ['15px', { lineHeight: '22px', fontWeight: '600' }],
        'body1': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body2': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '16px', fontWeight: '500' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      spacing: {
        '18': '4.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'gold': '0 0 20px rgba(255, 215, 0, 0.5)',
      },
      colors: {
        primary: {
          10: '#DA2F36',
          8: '#FF706C',
          6: '#FF9992',
          4: '#FFE8E2',
          2: '#FFF2ED',
        },
        secondary: {
          dark: '#A7998D',
          light: '#F6F1EB',
        },
        gray: {
          10: '#2D2C2B',
          9: '#403E3C',
          8: '#5A5856',
          7: '#7F7C79',
          6: '#A19E9B',
          5: '#BDBAB7',
          4: '#D3D1CE',
          3: '#E4E2E0',
          2: '#F3F2F1',
          1: '#FAFAF9',
        },
      },
    },
  },
  plugins: [],
}
