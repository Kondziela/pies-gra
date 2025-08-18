/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Nie blokuj buildu na błędach TS w developmencie
    ignoreBuildErrors: false,
  },
  eslint: {
    // Nie blokuj buildu na błędach ESLint w developmencie
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
