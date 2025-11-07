/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure JSON files are properly handled
      config.module.rules.push({
        test: /\.json$/,
        type: 'json',
      });
    }
    return config;
  },
  // Optimize for serverless deployment
  output: 'standalone',
}

module.exports = nextConfig
