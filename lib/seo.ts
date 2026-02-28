/**
 * SEO shared config. Set NEXT_PUBLIC_APP_URL in production for canonical URLs, sitemap, and OG.
 */
export const SITE_NAME = "OnTarget Resume Studio"
export const TAGLINE = "Hit the role. Every time."
export const DEFAULT_DESCRIPTION =
  "Optimize your resume for each job posting—Canadian standards, AI suggestions, and match scoring."

export function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "https://www.ontargetresumestudio.com"
}

export const DEFAULT_OG_IMAGE_PATH = "/og.png"
