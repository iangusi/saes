/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ipn: {
          guinda: '#6d1b34',
          oro: '#c8a951',
          gris: '#4a4a4a',
        },
      },
    },
  },
  plugins: [],
};
