import aspectRatio from "@tailwindcss/aspect-ratio";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,ts}",
    "./public/**/*.html",
    "./settings.yaml",
  ],
  darkMode: "class",
  theme: {
    extend: {
      lineClamp: {
        7: "7",
        8: "8",
      },
    },
  },
  plugins: [aspectRatio, typography],
};
