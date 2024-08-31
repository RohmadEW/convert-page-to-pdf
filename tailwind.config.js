/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cgray: {
          '100': '#DADADA',
          '300': '#555E68',
          '400': '#CBCBCB',
          '800': '#7A8086'
        },
        'venetian-red': '#C41C1C',
        'black-coral': '#555E68',
        'french-violet': '#6800C2',
        'forest-green': '#064306',
        'blood-organ': '#651111',
        'smoky-black': '#0B0D0E',
        'davy-grey': '#525252',
        'light-black': '#1D1C27',
        
      },
      fontSize: {
        'ss': '0.625rem' // 10px
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}