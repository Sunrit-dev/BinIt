/** @type {import('next').NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '');

const nextConfig = {
  async rewrites() {
    return [
      { source: "/media/:path*", destination: `${apiBase}/media/:path*` },
    ];
  },
};

module.exports = nextConfig;
