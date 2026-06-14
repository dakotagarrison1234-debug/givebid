import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PurposeBid",
    short_name: "PurposeBid",
    description: "Charity auctions for churches, schools, and nonprofits",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#09a7ad",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
