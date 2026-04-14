import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.replit.dev",
    "*.picard.replit.dev",
    process.env.REPLIT_DEV_DOMAIN || "",
  ].filter(Boolean),
};

export default nextConfig;
