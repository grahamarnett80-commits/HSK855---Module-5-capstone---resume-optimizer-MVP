import { getProjectsByUserId } from "@/actions/projects"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"

export default async function Page() {
  const projects = await getProjectsByUserId()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Optimize your resume for each job posting. Create a project to get started.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new" className="gap-2">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
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
              <Link
                href={`/dashboard/workspace/${p.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {p.jobPostingText ? "Job posting added" : "No job posting yet"} · Updated{" "}
                  {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
