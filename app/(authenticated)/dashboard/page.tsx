import { getProjectsByUserId, getCreditsForCurrentUser } from "@/actions/projects"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"
import { DeleteProjectButton } from "./_components/delete-project-button"
import { ProjectPacksSection } from "./_components/project-packs-section"

function CreditsDisplay({
  balance,
  freeProjectUsed
}: {
  balance: number
  freeProjectUsed: boolean
}) {
  let label: string
  if (!freeProjectUsed) {
    label = "Starter project available"
  } else if (balance > 0) {
    label = `${balance} project credit${balance !== 1 ? "s" : ""}`
  } else {
    label = "Starter used · 0 credits"
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm font-medium">Available credits:</span>
      <span className="text-muted-foreground rounded-md border bg-muted/50 px-2.5 py-1 text-sm">
        {label}
      </span>
    </div>
  )
}

export default async function Page() {
  const [projects, creditsResult] = await Promise.all([
    getProjectsByUserId(),
    getCreditsForCurrentUser()
  ])
  // Always show credits area; use fallback if fetch returned null (e.g. auth delay)
  const credits = creditsResult ?? { balance: 0, freeProjectUsed: true }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Optimize your resume for each job posting. Create a project to get started.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreditsDisplay balance={credits.balance} freeProjectUsed={credits.freeProjectUsed} />
          <Button asChild>
            <Link href="/dashboard/projects/new" className="gap-2">
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Create a project, add a job posting, and upload your resume to see your match score and get suggestions.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/projects/new">Create project</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <div className="relative rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <Link
                  href={`/dashboard/workspace/${p.id}`}
                  className="block"
                >
                  <h3 className="font-medium pr-8">{p.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {p.jobPostingText ? "Job posting added" : "No job posting yet"} · Updated{" "}
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
                <DeleteProjectButton projectId={p.id} projectName={p.name} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 border-t pt-8">
        <ProjectPacksSection />
      </div>
    </div>
  )
}
