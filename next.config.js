/** @type {import('next').NextConfig} */
const nextConfig = {
  /* No special external flags needed for Playwright’s static build */
  webpack: (config) => {
    config.resolve.alias.canvas = false;   // unchanged
    return config;
  }
};

module.exports = nextConfig;
