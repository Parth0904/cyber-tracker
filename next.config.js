/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/reviews',
        destination: '/',
        permanent: false,
      },
      {
        source: '/reviews/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/insights',
        destination: '/',
        permanent: false,
      },
      {
        source: '/insights/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
