import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // LeetCode-inspired dark theme
        lc: {
          bg: "#1a1a1a",
          surface: "#282828",
          card: "#2d2d2d",
          border: "#3e3e3e",
          hover: "#3a3a3a",
          text: "#eff1f6",
          muted: "#8d8d8d",
          easy: "#00b8a3",
          medium: "#ffc01e",
          hard: "#ff375f",
          accent: "#ffa116",
          link: "#4a90e2",
          green: "#00b8a3",
          yellow: "#ffc01e",
          red: "#ff375f",
          orange: "#ffa116",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
