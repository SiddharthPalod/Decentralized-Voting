/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'pink':'#FF5EAA',
        'dark': '#0B0D11',
      },
      fontFamily: {
        primary: ['Montserrat', 'sans-serif'],
        headline: ['Orbitron', 'sans-serif'],
        para: ['Lato', 'sans-serif'],
        game: ['Pixelify Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

