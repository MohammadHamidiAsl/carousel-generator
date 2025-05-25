/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent Next from bundling these large packages (Recorder, bidi, etc.) :contentReference[oaicite:7]{index=7}
    serverComponentsExternalPackages: [
      'playwright-core',
      'playwright-chromium'
    ]
  },

  // For Next 15+ (harmless in 14)
  serverExternalPackages: [
    'playwright-core',
    'playwright-chromium'
  ],

  webpack: (config) => {
    // Stub out optional native modules
    config.resolve.alias.canvas   = false;
    config.resolve.alias.electron = false;  // avoids bundling Electron code :contentReference[oaicite:8]{index=8}
    return config;
  }
};

module.exports = nextConfig;
