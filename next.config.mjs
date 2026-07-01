import withSerwistInit from "@serwist/next";

// PWA: App Router uyumlu service worker (offline app shell).
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Docker imajı için minimal runtime
  webpack: (config, { webpack, isServer }) => {
    // v86 evrensel build'i node:fs/promises'a referans verir; tarayıcıda gereksiz.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        "fs/promises": false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
    }
    return config;
  },
  // v86 (WASM emülatör) için izolasyon header'ları — SharedArrayBuffer + threads.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
