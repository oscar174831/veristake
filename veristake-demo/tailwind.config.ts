import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f8fafc",
        carrier: "#0f766e",
        claimant: "#2563eb",
        verifier: "#a16207"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"]
      },
      boxShadow: {
        panel: "0 18px 48px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
