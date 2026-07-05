import type { MetadataRoute } from "next";

/** Web App Manifest — face aplicația instalabilă pe telefon (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gospodărie — finanțe",
    short_name: "Gospodărie",
    description: "Evidența veniturilor și cheltuielilor gospodăriei.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ro",
    background_color: "#fbf8ff",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
