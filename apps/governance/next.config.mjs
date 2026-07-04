/** @type {import('next').NextConfig} */
// Governance lab as a Multi-Zones micro-frontend: served under /govern. The shell
// app rewrites /govern/* here. Static export; the live FastAPI service is reached
// at runtime via NEXT_PUBLIC_API_URL.
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: "/govern",
  assetPrefix: "/govern",
  transpilePackages: ["@labs/design-system", "@labs/program-core"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};
export default nextConfig;
