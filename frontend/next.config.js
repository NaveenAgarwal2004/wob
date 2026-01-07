/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.worldofbooks.com',
      },
    ],
  },
};

module.exports = nextConfig;
