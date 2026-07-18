/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit reads its own bundled AFM font-metrics files off disk using
  // __dirname-relative paths. If webpack bundles pdfkit's code, __dirname
  // no longer points at its real location on disk and those reads fail
  // (ENOENT for Helvetica.afm) on every single PDF generation. Keeping it
  // external stops webpack from touching it, so its own path resolution
  // — and Vercel's file tracing of the data files it reads — stays correct.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

module.exports = nextConfig;
