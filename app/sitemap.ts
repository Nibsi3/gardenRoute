import { MetadataRoute } from "next";
import { POSTS } from "./blogs/posts";
import { businessPoints } from "@/lib/businessData";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://gardenroutedefaults.com";

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Blog pages
  const blogPages = POSTS.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Business pages
  const businessPages: MetadataRoute.Sitemap = [];
  Object.entries(businessPoints).forEach(([zoneId, businesses]) => {
    businesses.forEach((business) => {
      const slug = `${zoneId}-${business.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").trim()}`;
      businessPages.push({
        url: `${baseUrl}/business/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    });
  });

  return [...staticPages, ...blogPages, ...businessPages];
}
