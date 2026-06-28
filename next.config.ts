import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Serwist injects a webpack config; Next 16 dev defaults to Turbopack and errors
  // on a stray webpack config. Empty turbopack config silences it. SW is disabled
  // in dev anyway; prod build runs `--webpack` so Serwist generates the SW.
  turbopack: {},
};

// PWA: generate service worker from src/app/sw.ts (§8). Disabled in dev for fast HMR.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
