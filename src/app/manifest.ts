import type { MetadataRoute } from "next";

/**
 * PWA manifest — served at /manifest.webmanifest.
 * Makes NETPrep Hub installable (Add to Home Screen / standalone app shell)
 * and provides the metadata Android APK wrappers (TWA/WebView) expect.
 * Additive only: no existing route or behavior is changed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NETPrep Hub — UGC NET Preparation Platform",
    short_name: "NETPrep",
    description:
      "Books, notes, cheat sheets, PYQs, MCQ practice, mock tests, study planner and progress tracking — everything you need for UGC NET preparation in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    orientation: "portrait",
    categories: ["books", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
