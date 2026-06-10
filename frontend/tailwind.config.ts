import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#06060f",
        bg2: "#0c0c1a",
        card: "#111122",
        card2: "#0e0e20",
        border: "rgba(139, 92, 246, 0.18)",
        borderBright: "rgba(139, 92, 246, 0.35)",
        purple: "#8b5cf6",
        pink: "#ec4899",
        teal: "#14b8a6",
        amber: "#f59e0b",
        green: "#10b981",
        red: "#ef4444",
        blue: "#3b82f6",
        text: "#f0effa",
        dim: "#9ca3c8",
        muted: "#4a4a6a",
      },
      fontFamily: {
        sans: ["Segoe UI", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        brand: ["Plus Jakarta Sans", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        "grad-brand": "linear-gradient(135deg, #8b5cf6, #ec4899)",
        "grad-green": "linear-gradient(135deg, #10b981, #14b8a6)",
        "grad-amber": "linear-gradient(135deg, #f59e0b, #ec4899)",
        "grad-timeline": "linear-gradient(180deg, #8b5cf6, #ec4899, #14b8a6, #10b981)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;