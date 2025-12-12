/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable standalone output for Cloud Run / Docker
  output: 'standalone',
  
  // Don't fail build on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Don't fail build on TypeScript errors (only warn)
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch real type errors
  },
};

export default nextConfig;
