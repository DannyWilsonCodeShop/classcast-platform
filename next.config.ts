import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Enable experimental features (Turbopack compatible)
  experimental: {
    // Enable server actions (object value for Next.js 15+)
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    // Note: typedRoutes is not supported in Turbopack yet
    // typedRoutes: true, // This will cause Turbopack to fail
  },
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Enable compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // React strict mode
  reactStrictMode: true,
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Note: swcMinify is enabled by default in Next.js 13+ and doesn't need to be specified
  // swcMinify: true, // This is the default behavior and doesn't need to be specified
};

export default nextConfig;
