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
        void: "var(--bg-void)",
        desk: "var(--bg-desk)",
        "surface-0": "var(--surface-0)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        faint: "var(--text-faint)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-ink": "var(--accent-ink)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        win: "var(--radius-win)",
        ui: "var(--radius-ui)",
        btn: "var(--radius-btn)",
      },
      boxShadow: {
        glow: "0 0 24px var(--accent-glow)",
        win: "inset 0 1px 0 var(--edge-light), 0 16px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px var(--border-soft)",
        float:
          "inset 0 1px 0 var(--edge-light), 0 8px 32px -8px rgba(0,0,0,0.7), 0 0 0 1px var(--border-soft)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
