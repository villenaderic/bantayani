/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        agri: {
          green: "#1F6B3B",
          gold: "#C89B3C",
        },
      },
    },
  },
  plugins: [],
};
