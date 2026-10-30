import type { NextConfig } from "next";
import { shop } from "./shops/current";

const nextConfig: NextConfig = {
  // Lets a phone open the dev server through a Cloudflare quick tunnel (AR needs https).
  allowedDevOrigins: ["*.trycloudflare.com"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Menu photos rarely change: keep each optimized version for 31 days instead of re-encoding it.
    minimumCacheTTL: 2678400,
    // Only the hosts the current shop declares (see shops/<slug>/shop.ts).
    remotePatterns: (shop.remoteImages ?? []).map(({ hostname, pathname }) => ({
      protocol: "https" as const,
      hostname,
      pathname,
      search: "",
    })),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
