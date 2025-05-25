// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone build keeps your lambdas lean
  output: 'standalone',

  // expose your BASE URL at runtime
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // drop any .map files so Webpack won’t try to parse them
  webpack(config) {
    config.module.rules.push({
      test: /\.js\.map$/i,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
