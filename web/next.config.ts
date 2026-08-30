import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/wall-of-shame",
        destination: "/#wall-of-shame",
        permanent: false,
      },
      {
        source: "/wall-of-fame",
        destination: "/#wall-of-fame",
        permanent: false,
      },
      {
        source: "/guild-wire",
        destination: "/#guild-wire",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
