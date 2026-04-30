/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'lab-gobeaute.vercel.app'],
    },
  },
}
module.exports = nextConfig
