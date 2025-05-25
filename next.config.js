/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Next 14 (your current version) ────────────────────────────────
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',          // keep the bin/ folder
      '@sparticuz/chromium-min'  // keep the bin/ folder
    ]
  },

  // ── Next 15+ (ignored by 14, useful for the future) ───────────────
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium-min'
  ],

  // your existing Webpack tweak
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

module.exports = nextConfig;
