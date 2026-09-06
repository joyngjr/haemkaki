/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          500: "#4f6df5",
          600: "#3b53d6",
          700: "#2f41a8",
        },
        // Warm neutrals pulled from the platelet's room, so chrome around the
        // scene reads as the same space rather than a grey app frame.
        sand: {
          50: "#FBF7EE",
          100: "#F3EBDC",
          200: "#E8DBC4",
          300: "#D6C4A4",
          400: "#B9A183",
          600: "#7C6647",
          700: "#5E4B32",
          900: "#3B2E20",
        },
      },
      keyframes: {
        "platelet-bob": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "platelet-bob": "platelet-bob 4s ease-in-out infinite",
        "sheet-up": "sheet-up 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
