import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Turbopack is now stable in Next.js 15
  // No additional configuration needed

  // Configure external packages that need special handling
  serverExternalPackages: [],

  // Webpack configuration for Three.js
  webpack: (config, { isServer }) => {
    // Handle Three.js WebGPU imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "three/webgpu": "three/build/three.webgpu.js",
      "three/tsl": "three/build/three.tsl.js",
    };

    return config;
  },
};

export default nextConfig;
