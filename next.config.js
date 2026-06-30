/** @type {import('next').NextConfig} */
const nextConfig = {
  // LLM services read prompts/*.md at runtime via loadPrompt(); include in serverless traces.
  outputFileTracingIncludes: {
    "/*": ["./prompts/**/*.md"],
  },
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
