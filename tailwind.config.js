const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // শুধু এই ফোল্ডারের class স্ক্যান হবে
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // মূল রং (teal): বাটনে 700 ব্যবহার হয়, কারণ সাদা লেখার সাথে contrast WCAG AA মানে
        brand: colors.teal,
      },
      fontFamily: {
        // বাইরের font লোড হয় না: দ্রুত ও privacy-বান্ধব
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
};
