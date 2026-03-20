/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1A9E9E",
        "primary-dark": "#0F6B6B",
        coral: {
          400: "#F09078",
          500: "#E87356",
          600: "#D45A3D",
        },
        background: "#FDFBF7",
        foreground: "#0a0a0a",
        muted: "#f5f5f5",
        "muted-foreground": "#737373",
        destructive: "#ef4444",
        parchment: {
          50: "#FDFBF7",
          100: "#FAF7F0",
          200: "#F5F0E6",
        },
        warm: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
        serif: ["Lora_400Regular"],
        "serif-bold": ["Lora_700Bold"],
      },
    },
  },
  plugins: [],
};
