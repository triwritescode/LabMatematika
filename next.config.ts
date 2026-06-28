import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Serwist injects a webpack config; Next 16 dev defaults to Turbopack and errors
  // on a stray webpack config. Empty turbopack config silences it. SW is disabled
  // in dev anyway; prod build runs `--webpack` so Serwist generates the SW.
  turbopack: {},

  // Defensive security headers. App is fully offline/same-origin (no third-party
  // resources, no inline-script execution we control), so these are safe to apply
  // globally. CSP uses frame-ancestors only — blocks clickjacking without risking
  // breakage of Next's bootstrap or Serwist's same-origin assets.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

// PWA: generate service worker from src/app/sw.ts (§8). Disabled in dev for fast HMR.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
