/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],
  transpilePackages: ["lucide-react"],
  allowedDevOrigins: [
    "localhost:3000",
    "localhost:3001",
    "192.168.1.12:3000",
    "192.168.1.12:3001",
  ],
};

export default nextConfig;
