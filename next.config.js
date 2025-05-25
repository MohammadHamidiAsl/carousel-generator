/** @type {import('next').NextConfig} */
const nextConfig = {
  // —— Next 14 settings ————————————————————————————————
  experimental: {
    // keep these packages external so Next doesn’t bundle them
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min'
    ]
  },

  // —— Next 15+ forward-compat (ignored by 14) ———————————
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium-min'
  ],

  webpack: (config) => {
    config.resolve.alias.canvas = false;   // your existing tweak
    return config;
  }
};

module.exports = nextConfig;
