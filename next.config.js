/** @type {import('next').NextConfig} */
const nextConfig = {
  /* ---- Next 14 (your current version) ---------------------------- */
  experimental: {
    /**
     * Keep the *entire* package in node_modules so its assets survive.
     */
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium-min',
    ],

    /**
     * Tell the output-file-tracer to copy chromium-min/bin/**
     * into the server bundle for THIS route handler.
     * 🔑 Key *must* include the file-extension!
     */
    outputFileTracingIncludes: {
      'app/api/generate/route.ts': [
        './node_modules/@sparticuz/chromium-min/bin/**',
      ],
    },
  },

  /* ---- Next 15+ (forward-compat, harmless in 14) ----------------- */
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium-min',
  ],

  webpack: (config) => {
    config.resolve.alias.canvas = false;   // whatever tweak you need
    return config;
  },
};

module.exports = nextConfig;
