import { SectionWrapper } from "../../_components/sections/section-wrapper"
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/seo"
import {
  BarChart3,
  FileSearch,
  History,
  MessageSquare,
  ShieldCheck,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Resume match scoring, AI suggestions, job posting analysis, and Canadian resume standards. See how OnTarget Resume Studio helps you land the role.",
  alternates: { canonical: `${getBaseUrl()}/features` }
}

const features = [
  {
    name: "AI Match Scoring",
    description:
      "Get an instant percentage score showing how well your resume matches a job posting. See exactly where you stand before applying. Refresh the score after edits to track improvement.",
    icon: BarChart3
  },
  {
    name: "Smart Suggestions",
    description:
      "Receive AI-powered, actionable suggestions to strengthen your resume for each specific position. Rewrites, keyword additions, and quantification—all tailored to your real experience.",
    icon: Sparkles
  },
  {
    name: "Resume Parsing",
    description:
      "Upload your resume as a PDF or Word document. We extract the text automatically so you can start optimizing immediately. One resume per project, with full version history.",
    icon: FileSearch
  },
  {
    name: "AI Chat Assistant",
    description:
      "Chat with an AI assistant that knows your resume and the job posting. Ask about a suggestion, request a targeted rewrite, or get clarification. The AI asks questions instead of making things up.",
    icon: MessageSquare
  },
  {
    name: "Version History",
    description:
      "Track every revision with version history. Save as new version after edits, compare scores across versions, and see your improvement over time. No more losing earlier drafts.",
    icon: History
  },
  {
    name: "Canadian Standards",
    description:
      "Optimized for Canadian resume best practices: 1–2 pages, no personal info, action verbs, quantified achievements, and ATS-friendly structure. No fabrication—only truthful improvements.",
    icon: ShieldCheck
  }
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      <SectionWrapper className="mx-auto max-w-4xl pb-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Features
        </h1>
        <p className="text-muted-foreground mt-4 text-lg leading-8">
          An IDE-style workspace that brings your job posting, resume, AI suggestions, and chat together in one view.
          Review, compare, and refine—hit the role, every time.
        </p>

        <ul className="mt-12 space-y-12">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <li key={feature.name} className="flex gap-6">
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="text-primary h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h2 className="text-foreground text-lg font-semibold">
                    {feature.name}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-base leading-7">
                    {feature.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-14 flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </SectionWrapper>
    </main>
  )
}
