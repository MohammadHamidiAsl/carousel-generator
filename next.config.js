/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Next 14 (current) ────────────────────────────────────────────────
  experimental: {
    /** Keep these packages external so their assets remain in node_modules */
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium'       // ← switched from -min
    ]
  },

  // ── Next 15+ forward compatibility (ignored by 14) ───────────────────
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium'
  ],

  // Optional: if you had traced the bin/ folder before, it's no longer needed
  // because the full package already contains it and Next will keep it.

  webpack: (config) => {
    config.resolve.alias.canvas = false;   // keep your existing tweak
    return config;
  }
};

module.exports = nextConfig;
