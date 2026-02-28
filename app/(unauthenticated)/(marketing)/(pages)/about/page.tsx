import { SectionWrapper } from "../../_components/sections/section-wrapper"
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/seo"
import { Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about OnTarget Resume Studio—AI-powered resume optimization for Canadian job seekers. Hit the role. Every time.",
  alternates: { canonical: `${getBaseUrl()}/about` }
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <SectionWrapper className="mx-auto max-w-3xl pb-24">
        <div className="flex items-center gap-3">
          <Target className="text-primary h-10 w-10" aria-hidden />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            About OnTarget Resume Studio
          </h1>
        </div>

        <p className="text-muted-foreground mt-6 text-lg leading-8">
          OnTarget Resume Studio helps you <strong className="text-foreground">review, compare, and refine</strong> your
          resume directly against the job posting—with AI that highlights gaps, suggests fixes, and keeps you in
          control. Our tagline says it: <strong className="text-foreground">Hit the role. Every time.</strong>
        </p>

        <h2 className="text-foreground mt-12 text-xl font-semibold">
          What we do
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-7">
          You add one job posting and one resume per project. We run an AI match score so you see how well your resume
          aligns with the role. Then you get concrete suggestions—rewrites, keywords, quantification—and an AI chat
          assistant that asks clarifying questions instead of guessing. You choose what to accept and what to edit.
          Full version history lets you track score changes as you improve.
        </p>

        <h2 className="text-foreground mt-10 text-xl font-semibold">
          Built for Canadian job seekers
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-7">
          We follow Canadian resume standards: 1–2 pages, no photo or birth date, action-oriented language, and
          ATS-friendly formatting. The AI is tuned to suggest truthful, accurate improvements based on your real
          experience—no fabrication.
        </p>

        <h2 className="text-foreground mt-10 text-xl font-semibold">
          You stay in control
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-7">
          Every suggestion is yours to accept, edit, or ignore. Exports (TXT, Word, PDF) are available with project
          packs so you can take your polished resume anywhere. One job, one resume, one project—so you can focus on
          landing that role.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/features">See features</Link>
          </Button>
        </div>
      </SectionWrapper>
    </main>
  )
}
