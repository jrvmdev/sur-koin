import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#f1f3f6",   // blanco Fiwin real
          dark: "#0b0e11",
        },
        surface: {
          light: "#f8fafc",   // NO blanco puro
          dark: "#1e2329",
        },
        border: {
          light: "#e2e8f0",
          dark: "rgba(255,255,255,0.08)",
        },
        text: {
          light: "#0f172a",
          dark: "#e5e7eb",
          muted: "#64748b",
        },
        success: "#22c55e",
        danger: "#ef4444",
        accent: "#7c3aed",
      },
      boxShadow: {
        card: "0 10px 28px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl: "16px",
      },
      aspectRatio: {
        card: "1 / 1", // 👈 cards cuadradas
      },
    },
  },
  plugins: [],
};

export default config;
