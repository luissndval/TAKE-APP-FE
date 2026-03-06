/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/backoffice",
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
