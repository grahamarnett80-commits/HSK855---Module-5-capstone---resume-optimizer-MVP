import { getBaseUrl, SITE_NAME, TAGLINE, DEFAULT_DESCRIPTION } from "@/lib/seo"

export function SEOJsonLd() {
  const baseUrl = getBaseUrl()

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    description: `${TAGLINE} ${DEFAULT_DESCRIPTION}`,
    url: baseUrl
  }

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: `${TAGLINE} ${DEFAULT_DESCRIPTION}`,
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CAD"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
    </>
  )
}
