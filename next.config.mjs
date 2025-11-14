/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests from local network during development
  allowedDevOrigins: ["172.20.10.4"],
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Compress responses
  compress: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Power optimizations
  poweredByHeader: false,
}

export default nextConfig
