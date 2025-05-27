/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        primaryFont: '#FFFFFF',
        secondaryFont: '#828282',
        accentFont: '#5010FF',
      }
    },
  },
  plugins: [],
}