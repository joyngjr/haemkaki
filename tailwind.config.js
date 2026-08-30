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
    },
  },
  plugins: [],
};
