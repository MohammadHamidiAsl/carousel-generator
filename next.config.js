/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the new App Router (if you’re using it)
  experimental: {
    appDir: true,
  },

  // Keep your environment var exposed
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // You no longer need any custom Webpack rules for Puppeteer,
  // nor .map stripping—Edge Functions don’t bundle node_modules.
  // So we can drop the webpack() override entirely.

  // (Optional) If you want to emit a standalone build for your pages
  // that still run under Node.js lambdas, you can uncomment:
  // output: 'standalone',

  // (Optional) If you need strict mode:
  reactStrictMode: true,
};

module.exports = nextConfig;
