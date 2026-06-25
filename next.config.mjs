/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static page data collection for API routes during build
  // (env vars are injected at runtime on Vercel)
  experimental: {},
};
export default nextConfig;
