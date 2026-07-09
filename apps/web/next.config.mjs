/** @type {import('next').NextConfig} */
// Modular monolith: one app composing every lab. Static export, client-side,
// no API key required. (Governance's FastAPI service is optional; the live demo
// uses the in-browser engine.)
const nextConfig = {
  reactStrictMode: true,
  // `next lint` is clean (eslint-config-next core-web-vitals); lint failures
  // now fail the build, same as type errors.
  eslint: { ignoreDuringBuilds: false },
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
    // Build stamp: which commit this bundle was built from (footer badge).
    // Vercel injects VERCEL_GIT_COMMIT_SHA at build time; local builds say "local".
    NEXT_PUBLIC_BUILD_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
  },
};
export default nextConfig;
