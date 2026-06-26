/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/topics",
        destination: "/collections",
        permanent: true,
      },
      {
        source: "/library",
        destination: "/collections",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
