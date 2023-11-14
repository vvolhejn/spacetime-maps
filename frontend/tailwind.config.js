/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*{.js,.jsx,.ts,.tsx,.html}", "./index.html"],
  theme: {
    extend: {
      colors: {
        primary: "#252a34"
      }
    },
    fontFamily: {
      sans: ["Gabarito, sans-serif", {
        fontVariationSettings: "'wght' 400",
      }],
    },
  },
  plugins: [],
}

