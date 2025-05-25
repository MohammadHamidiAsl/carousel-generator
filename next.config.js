/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone build keeps your lambdas lean
  output: 'standalone',

  // expose your BASE URL at runtime
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  webpack(config) {
    // 1) drop all of those .map files
    config.module.rules.push({
      test: /\.js\.map$/i,
      use: 'ignore-loader',
    });

    // 2) alias 'puppeteer' to puppeteer-core so chrome-aws-lambda won't crash
    config.resolve.alias = {
      ...config.resolve.alias,
      puppeteer: require.resolve('puppeteer-core'),
    };

    return config;
  },
};

module.exports = nextConfig;
