import { getProjectById } from "@/actions/projects"
import { getVersionsByProjectId } from "@/actions/resume-versions"
import { notFound } from "next/navigation"
import { WorkspaceView } from "./_components/workspace-view"

export default async function WorkspacePage({
  params
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId)
  if (!project) notFound()
  const versions = await getVersionsByProjectId(projectId)
  return (
    <WorkspaceView
      project={{
        id: project.id,
        name: project.name,
        jobPostingText: project.jobPostingText ?? "",
        interactionCount: project.interactionCount ?? 0,
        interactionCap: project.interactionCap ?? 25
      }}
      versions={versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        content: v.content,
        score: v.score,
        scoredAt: v.scoredAt?.toISOString() ?? null
      }))}
    />
  )
}
