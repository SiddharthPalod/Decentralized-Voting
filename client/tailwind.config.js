/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'pink': '#FF5EAA',
        'dark': '#0f0f0f',
        'charcoal': {
          DEFAULT: '#0f0f0f',
          card: '#141414',
          input: '#1c1c1c',
          border: '#282828',
          hover: '#222222',
        },
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
