import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#d4af37",
        "gold-dark": "#8a6d1a",
        "gold-muted": "#c9952a",
        "dark-base": "#1a1a1a",
        "dark-deep": "#0f0f0f",
        cream: "#fdfbf6",
        "cream-hover": "#faf8f3",
      },
    },
  },
  plugins: [],
};

export default config;
