// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // produce a standalone build to avoid bundling dev-deps
  output: 'standalone',

  // make sure your lambda can read this at runtime:
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // (optional) if you ever migrate to Edge OG:
  // experimental: { runtime: 'experimental-edge' },
};

module.exports = nextConfig;
