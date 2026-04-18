import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  allowedDevOrigins: [
    "*.replit.dev",
    "*.picard.replit.dev",
    process.env.REPLIT_DEV_DOMAIN || "",
  ].filter(Boolean),
=======
  allowedDevOrigins: ["*"],
  turbopack: {
    root: __dirname,
  },
>>>>>>> 62f6beab451be20776e4f2971ea01f8a55560c36
};

export default nextConfig;
