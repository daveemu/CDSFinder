/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sap: {
          blue: '#0070f3',
          dark: '#1a1a2e',
          gray: '#6b7280',
        },
      },
    },
  },
  plugins: [],
};
