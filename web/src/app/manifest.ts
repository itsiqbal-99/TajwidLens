import type { MetadataRoute } from "next";
import { assetPath } from "@/lib/asset-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: assetPath("/"),
    name: "TajwidLens — Pendamping Belajar Tajwid",
    short_name: "TajwidLens",
    description: "Baca Al-Qur'an, kenali hukum tajwid pada setiap ayat, dan pelajari cara membacanya dalam konteks.",
    start_url: assetPath("/"),
    scope: assetPath("/"),
    display: "standalone",
    orientation: "any",
    background_color: "#edf3f6",
    theme_color: "#2f4858",
    lang: "id",
    categories: ["education", "books", "lifestyle"],
    icons: [
      { src: assetPath("/android-chrome-192x192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: assetPath("/android-chrome-512x512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
