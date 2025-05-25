/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ---- Next 14 ------------------------------------------------------- */
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min',
    ],

    // keep the compressed Chromium stub in the bundle
    outputFileTracingIncludes: {
      // key = *route* (no file-extension)
      './app/api/generate/route': [
        './node_modules/@sparticuz/chromium-min/bin/**',
      ],
    },
  },

  /* ---- Next 15 + (forward-compat) ----------------------------------- */
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium-min',
  ],

  webpack: (config) => {
    // your existing alias
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
