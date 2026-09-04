import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
    ],
  },
  async redirects() {
    return [
      // "Consoles" naming retired — Agent Browser Interface hierarchy:
      // /agent-browser/interface/{terminal,bento-ui-editor,3d-rendering/...}
      { source: "/consoles/ava-console", destination: "/agent-browser/interface/terminal", permanent: false },
      { source: "/consoles/render-pipeline", destination: "/agent-browser/interface/3d-rendering", permanent: false },
      { source: "/consoles/esa-maintenance", destination: "/agent-browser/interface/3d-rendering/esa", permanent: false },
      { source: "/consoles/help-assembly", destination: "/agent-browser/interface/3d-rendering/helpassembly", permanent: false },
      { source: "/console", destination: "/agent-browser/interface/3d-rendering/esa", permanent: false },
    ];
  },
};

export default nextConfig;
