import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // The service worker must always be re-checked so updates reach installed apps promptly.
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
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
