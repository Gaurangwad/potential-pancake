import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Near-black editorial canvas
        ink: {
          DEFAULT: "#0b0c0a",
          soft: "#121311",
          card: "#16181500",
        },
        paper: "#0e100d",
        // Ivy green accent — used sparingly
        ivy: {
          DEFAULT: "#9DB380",
          soft: "#b6c7a0",
          dim: "#6f8159",
        },
        // Leak / waste framing
        leak: {
          DEFAULT: "#d98a6a",
          warn: "#d9b36a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
