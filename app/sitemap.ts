import type { MetadataRoute } from "next";

// Set NEXT_PUBLIC_SITE_URL in your deployment environment so the sitemap
// points at the real domain.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://convertit.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/belge",
    "/resim",
    "/tablo-donustur",
    "/pdf-birlestir",
    "/pdf-bol",
    "/hakkinda",
    "/iletisim",
    "/gizlilik",
    "/kullanim-kosullari",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/pdf") || route === "/belge" ? 0.8 : 0.5,
  }));
}
