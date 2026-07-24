import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP fallback — the partner logo strip is 40+ images.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  experimental: {
    // Rewrites barrel imports to deep paths so a single icon doesn't pull the
    // whole package into the client bundle.
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "@xyflow/react",
      "sonner",
    ],
  },
};

export default nextConfig;
