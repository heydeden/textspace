import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#3b82f6", dark: "#2563eb" },
      },
    },
  },
  plugins: [],
};
export default config;
