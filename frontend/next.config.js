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
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    NEXT_PUBLIC_WEATHER_API_KEY: process.env.NEXT_PUBLIC_WEATHER_API_KEY || '',
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
