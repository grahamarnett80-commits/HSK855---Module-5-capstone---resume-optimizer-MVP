import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()

  const publicRoutes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/features", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/signup", priority: 0.5, changeFrequency: "monthly" as const }
  ]

  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority
  }))
}
