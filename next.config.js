/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a standalone build so only production dependencies are bundled
  output: 'standalone',

  // Expose your BASE URL so your lambda can hit it correctly in prod
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // (Optional) If you ever migrate rendering to the Edge OG API:
  // experimental: { runtime: 'experimental-edge' },
};

module.exports = nextConfig;
