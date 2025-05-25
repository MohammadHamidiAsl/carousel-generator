/** @type {import('next').NextConfig} */
const nextConfig = {
  /* — Next 14 — */
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min'
    ]
  },

  /* — Next 15+ forward-compat — */
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium-min'
  ],

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

module.exports = nextConfig;
