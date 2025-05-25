/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent Next.js from bundling Playwright’s entire codebase
    serverComponentsExternalPackages: [
      'playwright-core',
      'playwright-chromium'
    ]
  },
  // For Next.js 15+ (ignored by 14.x)
  serverExternalPackages: [
    'playwright-core',
    'playwright-chromium'
  ],

  webpack: (config) => {
    // Stub out optional native modules and avoid loader errors
    config.resolve.alias.canvas   = false;
    config.resolve.alias.electron = false;
    return config;
  }
};

module.exports = nextConfig;
