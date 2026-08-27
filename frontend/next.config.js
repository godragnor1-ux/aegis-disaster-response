const path = require('path');

const resolvedApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:5001'
).replace(/\/+$/, '');

const resolvedSocketUrl = (
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:5001'
).replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: resolvedApiUrl,
    NEXT_PUBLIC_SERVER_URL: resolvedApiUrl,
    NEXT_PUBLIC_SOCKET_URL: resolvedSocketUrl,
  },
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];
    return config;
  },
};

module.exports = nextConfig;
