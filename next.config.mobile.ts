import type { NextConfig } from "next";

/**
 * Next.js configuration for Capacitor iOS builds.
 * Uses static export (output: 'export') so the app can be served
 * from the native WebView without a Node.js server.
 * 
 * Usage: NEXT_CONFIG_FILE=next.config.mobile.ts next build
 * Or rename this to next.config.ts before building for mobile.
 */
const mobileConfig: NextConfig = {
  output: 'export',
  
  // Trailing slashes work better with Capacitor file serving
  trailingSlash: true,

  // Images must use unoptimized mode for static export
  images: {
    unoptimized: true,
  },

  // Exclude API routes and server-side pages from static export
  // The mobile app will call these on your deployed backend instead
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/auth/login': { page: '/auth/login' },
    };
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '3gb',
    },
    optimizePackageImports: ['@/components', '@/lib', 'lucide-react'],
  },

  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default mobileConfig;
