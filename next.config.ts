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
  turbopack: {
    resolveAlias: {
      // opencv.js is an Emscripten build that references `fs` and `path`
      // inside a Node-only branch. Aliased away for the browser so the face
      // liveness chunk resolves; the branch is unreachable there.
      fs: { browser: "./stubs/empty-module.js" },
      path: { browser: "./stubs/empty-module.js" },
    },
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
