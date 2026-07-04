/** @type {import('next').NextConfig} */
// Modular monolith: one app composing every lab. Static export, client-side,
// no API key required. (Governance's FastAPI service is optional; the live demo
// uses the in-browser engine.)
const nextConfig = {
  reactStrictMode: true,
  // TODO: flip to false once `next lint` is verified clean (pre-existing lint
  // findings, e.g. key-prop warnings, have not been triaged yet).
  eslint: { ignoreDuringBuilds: true },
  // Type errors DO fail the build — the monorepo typechecks clean
  // (`pnpm typecheck` is green after the package-boundary deps were declared).
  typescript: { ignoreBuildErrors: false },
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ["@labs/kit", "@labs/design-system", "@labs/program-core", "@labs/lab-framing", "@labs/lab-deploy", "@labs/lab-realize"],
  // The governance lab (packages/lab-governance) is consumed via the @gov path
  // alias as source outside this app dir.
  experimental: { externalDir: true },
  // Governance runs client-side in the demo (in-browser engine, no backend). To
  // use the optional FastAPI service instead, set NEXT_PUBLIC_STATIC_DEMO="0" and
  // NEXT_PUBLIC_API_URL to the service.
  env: {
    NEXT_PUBLIC_STATIC_DEMO: process.env.NEXT_PUBLIC_STATIC_DEMO || "1",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  },
};
export default nextConfig;
