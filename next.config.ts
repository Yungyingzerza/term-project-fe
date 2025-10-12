import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use a custom loader to bypass the domain restriction
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
  },
};

export default nextConfig;
