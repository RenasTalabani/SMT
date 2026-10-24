import type { NextConfig } from "next";

// Where the Express API runs. The web app can call it directly
// (NEXT_PUBLIC_API_URL=http://localhost:5000/api) or same-origin through the
// proxy below (NEXT_PUBLIC_API_URL=/api) — handy behind one domain / tunnel
// and for browsers that block cross-port requests.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
      { source: "/socket.io/:path*", destination: `${BACKEND_URL}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
