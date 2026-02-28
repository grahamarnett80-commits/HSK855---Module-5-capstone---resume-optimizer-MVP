import { CheckoutRedirect } from "@/components/payments/checkout-redirect"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TailwindIndicator } from "@/components/utility/tailwind-indicator"
import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { getBaseUrl, SITE_NAME, TAGLINE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE_PATH } from "@/lib/seo"
import "./globals.css"

export const dynamic = "force-dynamic"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

const baseUrl = getBaseUrl()
const fullDescription = `${TAGLINE} ${DEFAULT_DESCRIPTION}`

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: fullDescription,
  keywords: [
    "resume optimizer",
    "resume builder",
    "job application",
    "Canadian resume",
    "resume match score",
    "AI resume",
    "job posting",
    "resume suggestions",
    "career"
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: baseUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: fullDescription,
    images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630, alt: SITE_NAME }]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: fullDescription
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  alternates: { canonical: baseUrl }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/" signInFallbackRedirectUrl="/dashboard">
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              {children}
              <CheckoutRedirect />

              <TailwindIndicator />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
