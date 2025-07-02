/** @type {import('tailwindcss').Config} */
const { colors } = require('./constants/colors');

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
        UrbanistSemiBold: ["Urbanist-SemiBold"],
        UrbanistRegular: ["Urbanist-Regular"],
      },
      colors: {
        primaryBG: colors.primaryBG,
        secondaryBG: colors.secondaryBG,
        primaryFont: colors.primaryFont,
        secondaryFont: colors.secondaryFont,
        accentFont: colors.accentFont,
        buttonPrimary: colors.buttonPrimary,
        buttonSecondary: colors.buttonSecondary,
        buttonPrimaryBG: colors.buttonPrimaryBG,
        inputBG: colors.inputBG,
        divider: colors.divider,
        border: colors.border,
        modal: colors.modal,
      }
    },
  },
  plugins: [],
}