/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // CORS headers are handled in individual API routes via corsHandler
  // This config is kept minimal to avoid conflicts
};

module.exports = nextConfig;

