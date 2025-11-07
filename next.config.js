/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure chroma_db is included in the build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Include chroma_db directory in the build
      config.externals = config.externals || [];
      config.externals.push({
        'chromadb': 'chromadb'
      });
    }
    return config;
  },
  // Optimize for serverless deployment
  output: 'standalone',
}

module.exports = nextConfig
