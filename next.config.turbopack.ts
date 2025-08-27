import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Turbopack-compatible experimental features only
  experimental: {
    // Enable server actions (boolean value for Turbopack compatibility)
    serverActions: true,
    // IMPORTANT: typedRoutes is NOT supported in Turbopack yet
    // This will cause the error: "Unsupported Next.js configuration option(s)"
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
  
  // Note: swcMinify is enabled by default in Next.js 13+ and doesn't need to be specified
};

export default nextConfig;
