/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#FF7F50",
        secondary: "#8B4513",
        accent: {
          light: "#FFB299",
          DEFAULT: "#FF7F50",
          dark: "#E66A3E",
        },
        brown: {
          light: "#a65d1e",
          DEFAULT: "#8B4513",
          dark: "#6b3410",
        },
      },
      boxShadow: {
        modern:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "modern-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        modern: "0.75rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        float: "float 3s ease-in-out infinite",
        blink: "blink 4s ease-in-out infinite",
        "bounce-slow": "bounce 3s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        in: "in 0.2s ease-out",
        out: "out 0.2s ease-in",
        "fade-in-0": "fade-in-0 0.2s ease-in-out",
        "fade-out-0": "fade-out-0 0.2s ease-in-out",
        "zoom-in-95": "zoom-in-95 0.2s ease-in-out",
        "zoom-out-95": "zoom-out-95 0.2s ease-in-out",
        "slide-in-from-top-2": "slide-in-from-top-2 0.2s ease-out",
        "slide-in-from-bottom-2": "slide-in-from-bottom-2 0.2s ease-out",
        "slide-in-from-left-2": "slide-in-from-left-2 0.2s ease-out",
        "slide-in-from-right-2": "slide-in-from-right-2 0.2s ease-out",
        progress: "progress 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blink: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.8)", opacity: "0.5" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        in: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        out: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "fade-in-0": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out-0": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "zoom-in-95": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "zoom-out-95": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-from-top-2": {
          from: { opacity: "0", transform: "translateY(-0.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-bottom-2": {
          from: { opacity: "0", transform: "translateY(0.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-left-2": {
          from: { opacity: "0", transform: "translateX(-0.5rem)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-from-right-2": {
          from: { opacity: "0", transform: "translateX(0.5rem)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        progress: {
          "0%": { width: "0%", marginLeft: "0%" },
          "50%": { width: "100%", marginLeft: "0%" },
          "100%": { width: "0%", marginLeft: "100%" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        c_and_p_theme: {
          primary: "#FF7F50",
          secondary: "#8B4513",
          accent: "#FFB299",
          neutral: "#3d4451",
          "base-100": "#ffffff",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
      "light",
      "dark",
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
  },
};
