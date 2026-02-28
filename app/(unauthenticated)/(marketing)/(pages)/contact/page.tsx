import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with OnTarget Resume Studio. Questions about resume optimization, Canadian standards, or AI match scoring? Contact us.",
  alternates: { canonical: `${getBaseUrl()}/contact` }
}

export default function ContactPage() {
  return (
    <div>
      <h1>Contact</h1>
    </div>
  )
}
