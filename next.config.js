/** @type {import('next').NextConfig} */
const nextConfig = {
  // static export: build করলে "out" ফোল্ডার তৈরি হয় (Cloudflare Pages এটাই serve করে)
  output: 'export',
  // static export-এ Next.js-এর image optimizer কাজ করে না
  images: { unoptimized: true },
  reactStrictMode: true,
  // ESLint আলাদা করে সেট করা হয়নি, তাই build-এর সময় বাদ রাখা হলো (TypeScript পরীক্ষা চালু থাকে)
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
