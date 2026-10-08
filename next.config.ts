import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/alwafa-expense-system',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig