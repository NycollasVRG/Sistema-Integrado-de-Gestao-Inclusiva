/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ifpb: {
          teal: '#0F6460',
          tealHover: '#0B4F4C',
          tealLight: '#E6F0EF',
          green: '#3FA14C',
          greenHover: '#2E8B3B',
          greenLight: '#EBF6EC',
          breadcrumb: '#EEF1EC',
          dark: '#424242',
          blue: '#3083EE',
          red: '#C8102E',
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
