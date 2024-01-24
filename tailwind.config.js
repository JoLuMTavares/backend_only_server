/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./dist/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#FFADAD',
          200: '#FFEFB7',
          300: '#001D40', // Navi, Buttons
          400: '#00142D',
        },
        'black': '#000',
        'white': '#fff',
        'typo': '#e0e0e0',
      },
      fontSize: {
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '1rem',
        'lg': '0.8rem',
        'full': '9999px',
        'large': '12px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-fluid-type'),
  ],
}
