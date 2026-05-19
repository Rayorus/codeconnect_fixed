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
        cc: {
          bg: "#09090b",
          "bg-alt": "#0c0c0e",
          surface: "rgba(18, 18, 20, 0.85)",
          "surface-solid": "#121214",
          card: "rgba(24, 24, 28, 0.7)",
          "card-solid": "#18181c",
          border: "rgba(249, 115, 22, 0.12)",
          "border-glow": "rgba(249, 115, 22, 0.25)",
          hover: "rgba(249, 115, 22, 0.07)",
          text: "#f0f0f0",
          "text-secondary": "#b8b8c0",
          muted: "#71717a",
          accent: "#f97316",
          "accent-light": "#fb923c",
          "accent-glow": "rgba(249, 115, 22, 0.4)",
          cyan: "#fbbf24",
          "cyan-glow": "rgba(251, 191, 36, 0.3)",
          violet: "#ea580c",
          "violet-glow": "rgba(234, 88, 12, 0.3)",
          easy: "#34d399",
          medium: "#fbbf24",
          hard: "#f87171",
          link: "#60a5fa",
          success: "#34d399",
          danger: "#f87171",
        },
        lc: {
          bg: "#09090b",
          surface: "rgba(18, 18, 20, 0.85)",
          card: "rgba(24, 24, 28, 0.7)",
          border: "rgba(249, 115, 22, 0.12)",
          hover: "rgba(249, 115, 22, 0.07)",
          text: "#f0f0f0",
          muted: "#71717a",
          easy: "#34d399",
          medium: "#fbbf24",
          hard: "#f87171",
          accent: "#f97316",
          link: "#60a5fa",
          green: "#34d399",
          yellow: "#fbbf24",
          red: "#f87171",
          orange: "#f97316",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-in-up": "fadeInUp 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "gradient-shift": "gradientShift 6s ease infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px rgba(249, 115, 22, 0.12)",
        "glow-md": "0 0 25px rgba(249, 115, 22, 0.15)",
        "glow-lg": "0 0 40px rgba(249, 115, 22, 0.18)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 32px rgba(249, 115, 22, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
