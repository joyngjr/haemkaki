/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        // Headline figures only — vials, days, dates on a calendar cell.
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        /* The clinical palette, straight off the UI kit artboard.
           Semantic names, because "which brown was the border again" was the
           thing that kept going wrong. */
        paper: "#F2F1EE", // page ground
        card: "#FFFFFF", // raised surface
        soft: "#F7F6F3", // a panel inside a card
        line: "#E7E5E0", // hairline border
        "line-soft": "#F4F2EE", // divider between table rows
        rail: "#EDEBE6", // meter track, today's calendar cell
        ink: {
          DEFAULT: "#242A2F",
          strong: "#3A424A",
          muted: "#5C646C",
          subtle: "#7E858D",
          faint: "#8B9199",
          disabled: "#9AA0A7",
        },
        slate: {
          50: "#F1F4F6",
          100: "#EAEDEF",
          300: "#B3C6D4",
          500: "#3A5E76",
          600: "#274A63", // action
          700: "#1E3B4F",
        },
        teal: {
          50: "#E6EDEB",
          600: "#2C7A70", // data
          700: "#1F6158",
          800: "#174A44",
        },
        brick: {
          50: "#FBF1EF",
          100: "#F2E8E5",
          200: "#EBD3CE",
          600: "#A63A2E", // critical
          700: "#8E4237",
        },
        ochre: {
          50: "#FBF6EB",
          100: "#EFEBE2",
          200: "#E8DCC0",
          600: "#B9832C", // caution
          700: "#8A5E14",
        },
        moss: {
          600: "#3C8A63", // on track
          700: "#2E6B4C",
        },
        garnet: "#B34A42", // the mascot, and only the mascot

        /* Kept so screens this pass does not touch stop clashing: the old
           sand/brand scales now resolve to the palette above. */
        sand: {
          50: "#F2F1EE",
          100: "#EDEBE6",
          200: "#E7E5E0",
          300: "#D9D6CF",
          400: "#A8AEB5",
          600: "#5C646C",
          700: "#3A424A",
          900: "#242A2F",
        },
        brand: {
          50: "#F1F4F6",
          100: "#EAEDEF",
          500: "#3A5E76",
          600: "#274A63",
          700: "#1E3B4F",
        },
      },
      borderRadius: {
        card: "20px",
        control: "14px",
      },
      keyframes: {
        "platelet-bob": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        // Kaki squashes when tapped, so the scene answers a press.
        "kaki-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(0.92, 1.06)" },
          "70%": { transform: "scale(1.05, 0.95)" },
          "100%": { transform: "scale(1)" },
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
        "kaki-pop": "kaki-pop 600ms ease-out",
        "sheet-up": "sheet-up 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
