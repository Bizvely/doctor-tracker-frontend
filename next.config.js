/** @type {import('next').NextConfig} */
const nextConfig = {
  // static export চালু: build করলে "out" ফোল্ডার তৈরি হবে (Cloudflare এটাই খুঁজছে)
  output: 'export',
  // static export-এ Next.js-এর image optimizer কাজ করে না, তাই বন্ধ রাখা হলো
  images: { unoptimized: true },
};

module.exports = nextConfig;
