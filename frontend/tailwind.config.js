/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                playfair: ['Playfair Display', 'serif'],
                instrument: ['Instrument Serif', 'serif'],
                grotesk: ['Space Grotesk', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
