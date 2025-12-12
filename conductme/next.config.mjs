/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable standalone output for Cloud Run / Docker
  output: 'standalone',
  
  // Don't fail build on ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignore TypeScript errors for Cloud Run deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
