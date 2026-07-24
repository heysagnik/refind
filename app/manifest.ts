import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReFind — Lost & Found",
    short_name: "ReFind",
    description: "Report and reclaim lost items in your community.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F9",
    theme_color: "#2563EB",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}