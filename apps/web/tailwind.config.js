const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    path.join(__dirname, "./app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./lib/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./src/**/*.{js,ts,jsx,tsx,mdx}"),
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#edfcf2",
          100: "#d3f7e1",
          200: "#aaefc6",
          300: "#73e0a3",
          400: "#3ac87c",
          500: "#22a15e",
          600: "#168049",
          700: "#13653b",
          800: "#125131",
          900: "#10432a",
          950: "#041e12",
        },
        surface: {
          50: "#f6f9f7",
          100: "#e4ece7",
          200: "#c9d8cf",
          300: "#a4bdb0",
          400: "#7c9d8c",
          500: "#5c806f",
          600: "#466556",
          700: "#395146",
          800: "#2f423a",
          900: "#0d2119",
          950: "#040d09",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #22a15e 0%, #14b8a6 100%)",
      },
      boxShadow: {
        "glow-forest": "0 0 25px -4px rgba(34, 161, 94, 0.45)",
        "glow-red": "0 0 25px -4px rgba(239, 68, 68, 0.45)",
        "glow-amber": "0 0 25px -4px rgba(245, 158, 11, 0.45)",
      },
    },
  },
  plugins: [],
};
