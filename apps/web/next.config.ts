import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@legendary-hunts/types", "@legendary-hunts/config", "@legendary-hunts/core"],
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
