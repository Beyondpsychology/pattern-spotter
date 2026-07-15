import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#2C3535",
        cream: "#F5F0E8",
        terracotta: "#D9735C",
        mint: "#d4e4e0",
        brown: "#7a6248",
      },
      fontFamily: {
        display: ["var(--font-abril)", "serif"],
        accent: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-opensans)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 2px 10px rgba(44, 53, 53, 0.08)",
        "card-hover": "0 8px 24px rgba(44, 53, 53, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
