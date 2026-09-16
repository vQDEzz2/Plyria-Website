import type { MetadataRoute } from "next";

// Served at https://plyria.net/robots.txt. Points search engines at the sitemap and keeps them
// out of the developer preview pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/dev/" },
    sitemap: "https://plyria.net/sitemap.xml",
  };
}
