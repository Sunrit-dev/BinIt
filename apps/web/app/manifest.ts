import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Binit — Spot It. Snap It. Solve It.",
    short_name: "Binit",
    description: "AI-powered civic waste intelligence for Kolkata Urban and Gram Panchayat zones.",
    lang: "en",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#040d09",
    theme_color: "#040d09",
    categories: ["utilities", "government", "environment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Report waste", url: "/citizen/report" },
      { name: "Explore map", url: "/citizen/map" },
    ],
  };
}