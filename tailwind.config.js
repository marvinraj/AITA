/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        NewsreaderRegular: ["Newsreader-Regular"],
        BellezaRegular: ["Belleza-Regular"],
        InterRegular: ["Inter-Regular"],
        InterBold: ["Inter-Bold"],
      },
      colors: {
        primaryBG: '#0d0d0d',
        secondaryBG: '#1F1E1E',
        primaryFont: '#FFFFFF',
        secondaryFont: '#828282',
        accentFont: '#7C3AED',
        buttonPrimary: '#FFFFFF',
        buttonSecondary: '#FFFFFF',
        inputBG: '#1B1C1D'
      }
    },
  },
  plugins: [],
}