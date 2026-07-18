/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @sparticuz/chromium locates its own bin/ folder using paths relative to
  // its own module location. Webpack bundling those files into a single
  // route chunk breaks that lookup ("input directory .../bin does not
  // exist"), even when the files are present in the deployment. Marking it
  // (and puppeteer-core) as an external package stops webpack from bundling
  // its code at all, so the package's own path resolution runs against the
  // real node_modules layout. outputFileTracingIncludes is still needed so
  // Vercel actually ships the (otherwise untraced) binary files.
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    outputFileTracingIncludes: {
      "/app/api/generate-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/app/api/generate": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
  },
};

module.exports = nextConfig;
