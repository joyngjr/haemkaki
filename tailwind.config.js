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
      },
      keyframes: {
        "platelet-bob": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "platelet-bob": "platelet-bob 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
