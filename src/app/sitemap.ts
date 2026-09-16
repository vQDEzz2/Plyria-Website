import type { MetadataRoute } from "next";

// Served at https://plyria.net/sitemap.xml for Google Search Console.
// Only pages a visitor can open without logging in: the rest send search engines to the login page.
const SITE = "https://plyria.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/download`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
