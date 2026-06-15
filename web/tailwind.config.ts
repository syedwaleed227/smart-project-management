import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          500: "#3b6cf6",
          600: "#2f5ae0",
          700: "#2447b8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
