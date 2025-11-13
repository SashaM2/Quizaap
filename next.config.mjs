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
}

export default nextConfig
