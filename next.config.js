/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @sparticuz/chromium's bundled binary isn't picked up by Next's default
  // file tracing, which makes puppeteer-core fail at runtime on Vercel with
  // "input directory .../bin does not exist". Explicitly include it for the
  // two routes that render PDFs.
  experimental: {
    outputFileTracingIncludes: {
      "/app/api/generate-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/app/api/generate": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
  },
};

module.exports = nextConfig;
