/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pale-cyan': '#bcf5ff',
        'sky-blue': '#7bbbff', 
        'medium-slate-blue': '#5c55e1',
        'lime-green': '#9ed454',
        'tan': '#c9a37c',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
