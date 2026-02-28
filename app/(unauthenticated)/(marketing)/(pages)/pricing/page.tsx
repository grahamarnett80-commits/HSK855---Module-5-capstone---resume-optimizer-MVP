import { SectionWrapper } from "../../_components/sections/section-wrapper"
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/seo"
import { Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pricing plans for OnTarget Resume Studio. Optimize your resume for each job with AI suggestions and match scoring. Free tier available.",
  alternates: { canonical: `${getBaseUrl()}/pricing` }
}

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <SectionWrapper className="mx-auto max-w-4xl pb-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pricing
        </h1>
        <p className="text-muted-foreground mt-4 text-lg leading-8">
          One project = one job application. Start with a free Starter Project; add more with one-time project packs.
          No subscription—buy once, use when you need it.
        </p>

        {/* Free tier */}
        <div className="bg-muted/30 mt-12 rounded-2xl border p-8">
          <h2 className="text-foreground text-xl font-semibold">
            Starter (free)
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            1 project · 25 AI uses per project
          </p>
          <p className="text-foreground mt-4 text-3xl font-bold">
            $0
          </p>
          <ul className="text-muted-foreground mt-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="text-primary h-4 w-4 shrink-0" />
              One job posting + one resume per project
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-primary h-4 w-4 shrink-0" />
              Match score, suggestions, and AI chat (within 25 uses)
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-primary h-4 w-4 shrink-0" />
              Version history (last 5 versions)
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="opacity-80">Export (TXT, Word, PDF) — with project packs</span>
            </li>
          </ul>
          <Button className="mt-6" asChild>
            <Link href="/signup">Get started free</Link>
          </Button>
        </div>

        {/* Project packs */}
        <h2 className="text-foreground mt-14 text-xl font-semibold">
          Project packs (one-time, CAD)
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          More projects and more AI uses per project. Exports included. Credits never expire.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border p-6">
            <h3 className="text-foreground font-semibold">3 projects</h3>
            <p className="text-muted-foreground mt-1 text-xs">50 AI uses per project</p>
            <p className="text-foreground mt-4 text-2xl font-bold">$19</p>
            <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                Export (TXT, Word, PDF)
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                Full version history
              </li>
            </ul>
            <Button variant="outline" className="mt-6 w-full" size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>

          <div className="border-primary relative rounded-xl border-2 p-6">
            <span className="bg-primary text-primary-foreground absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-semibold rounded">
              Most popular
            </span>
            <h3 className="text-foreground font-semibold">10 projects</h3>
            <p className="text-muted-foreground mt-1 text-xs">75 AI uses per project</p>
            <p className="text-foreground mt-4 text-2xl font-bold">$39</p>
            <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                Export (TXT, Word, PDF)
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                Full version history
              </li>
            </ul>
            <Button className="mt-6 w-full" size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-foreground font-semibold">25 projects</h3>
            <p className="text-muted-foreground mt-1 text-xs">100 AI uses per project</p>
            <p className="text-foreground mt-4 text-2xl font-bold">$79</p>
            <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                Export (TXT, Word, PDF)
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-primary h-3.5 w-3.5 shrink-0" />
                Full version history
              </li>
            </ul>
            <Button variant="outline" className="mt-6 w-full" size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mt-10 text-sm">
          Signed in? Buy packs from your dashboard after creating your free Starter Project.
        </p>
        <Button variant="link" className="mt-2 px-0" asChild>
          <Link href="/dashboard#pricing">Go to dashboard →</Link>
        </Button>
      </SectionWrapper>
    </main>
  )
}
