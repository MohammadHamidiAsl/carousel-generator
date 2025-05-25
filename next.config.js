/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Opt out Playwright from Server Component bundling:
    serverComponentsExternalPackages: [
      'playwright-core',
      'playwright-chromium'
    ]
  },

  // Forward-compat for Next 15+:
  serverExternalPackages: [
    'playwright-core',
    'playwright-chromium'
  ],

  webpack: (config) => {
    // Prevent bundling optional native modules:
    config.resolve.alias.canvas   = false;
    config.resolve.alias.electron = false;
    return config;
  }
};

module.exports = nextConfig;
