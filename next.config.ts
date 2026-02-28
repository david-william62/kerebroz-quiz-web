import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['googleapis', 'bcryptjs'],
};

export default nextConfig;
