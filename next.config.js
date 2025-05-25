/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ── Next 14 options ────────────────────────────────────────────── */
  experimental: {
    /** keep these packages external so their folders stay in node_modules */
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min'
    ],

    /** copy the tiny bin/ placeholder so chromium-min can stage the download */
    outputFileTracingIncludes: {
      'app/api/generate/route.ts': [
        './node_modules/@sparticuz/chromium-min/bin/**'
      ]
    }
  },

  /* ── Next 15+ forward-compat (ignored by 14) ────────────────────── */
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
