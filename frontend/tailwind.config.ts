import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1b74e4",
          dark: "#185abc"
        },
        accent: "#f97316"
      }
    }
  },
  plugins: []
};

export default config;
