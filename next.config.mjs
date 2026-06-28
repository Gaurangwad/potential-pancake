/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep pdfjs out of the server bundle so its ESM worker resolves from
  // node_modules at runtime. Works under both Turbopack (Next 16 default) and
  // webpack — no bundler-specific config needed.
  serverExternalPackages: ["pdfjs-dist"],
  // The pdfjs worker is loaded via a runtime path string, so the file tracer
  // can't see it. Force it into the /api/audit serverless function on Vercel,
  // otherwise PDF parsing would fail with a missing-worker error in production.
  outputFileTracingIncludes: {
    "/api/audit": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
