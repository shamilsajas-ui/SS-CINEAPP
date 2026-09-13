import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cine: {
          950: "#070a10",
          900: "#0c101a",
          850: "#101624",
          800: "#161d2e",
          700: "#222c42",
          600: "#33415f",
          500: "#4f6186",
          accent: "#6366f1",
          gold: "#f59e0b",
          red: "#ef4444",
        },
        seat: {
          available: "#10b981",
          selected: "#6366f1",
          held: "#f59e0b",
          booked: "#334155",
          blocked: "#1e293b",
          vip: "#a855f7",
          premium: "#3b82f6",
          accessible: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.4)",
        gold: "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        screen: "0 20px 45px -10px rgba(99, 102, 241, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
