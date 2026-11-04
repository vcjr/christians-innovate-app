import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This folder is its own app inside the repo; without this Next would treat the repo root
  // (the member app) as the project.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
