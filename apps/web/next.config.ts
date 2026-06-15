import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sorriso-sentinel/shared'],
  output: 'standalone',
};

export default nextConfig;
