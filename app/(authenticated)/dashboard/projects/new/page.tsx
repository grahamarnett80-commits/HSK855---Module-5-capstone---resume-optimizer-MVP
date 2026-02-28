"use client"

import { createProject, getCreditsForCurrentUser } from "@/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [jobPostingUrl, setJobPostingUrl] = useState("")
  const [jobPostingText, setJobPostingText] = useState("")
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState<{ balance: number; freeProjectUsed: boolean } | null>(null)

  useEffect(() => {
    getCreditsForCurrentUser().then(setCredits)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a project name.")
      return
    }
    if (!jobPostingText.trim() && !jobPostingUrl.trim()) {
      toast.error("Please paste the job posting or enter a URL.")
      return
    }
    setLoading(true)
    const result = await createProject({
      name: name.trim(),
      jobPostingUrl: jobPostingUrl.trim() || undefined,
      jobPostingText: jobPostingText.trim() || undefined
    })
    setLoading(false)
    if (result.success && result.project) {
      toast.success("Project created.")
      router.push(`/dashboard/workspace/${result.project.id}`)
    } else {
      if (result.code === "no_credits") {
        toast("Your Starter Project is in use. Unlock more job applications with a one-time project pack—3, 10, or 25 projects, with more AI uses per project and exports included.", {
          action: { label: "See project packs", onClick: () => router.push("/dashboard#pricing") },
          duration: 12000
        })
      } else {
        toast.error(result.error ?? "Failed to create project.")
      }
    }
  }

  const creditsLabel =
    credits === null
      ? null
      : !credits.freeProjectUsed
        ? "You have 1 free Starter project."
        : credits.balance > 0
          ? `You have ${credits.balance} project credit${credits.balance !== 1 ? "s" : ""}.`
          : "You need a project pack to create another project."

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New project</h1>
        <p className="text-muted-foreground mt-1">
          Add a job posting (paste or URL) to start optimizing your resume.
        </p>
        {creditsLabel && (
          <p className="text-muted-foreground mt-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {creditsLabel}
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input
            id="name"
            placeholder="e.g. Senior Developer at Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">Job posting URL (optional)</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            value={jobPostingUrl}
            onChange={(e) => setJobPostingUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paste">Job posting text</Label>
          <Textarea
            id="paste"
            placeholder="Paste the full job description here..."
            rows={12}
            className="font-mono text-sm"
            value={jobPostingText}
            onChange={(e) => setJobPostingText(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create project"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
