/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '192.168.1.32',
    'http://192.168.1.32:3000',
  ],
};

module.exports = nextConfig;