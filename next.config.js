/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  swcMinify: true,
  // Important for MongoDB
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'prisma', '@prisma/client']
  },
  // Remove x-powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig