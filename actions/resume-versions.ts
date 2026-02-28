"use server"

import { db } from "@/db"
import { resumeVersions } from "@/db/schema/resume-versions"
import { getProjectById } from "@/actions/projects"
import { currentUser } from "@clerk/nextjs/server"
import { desc, eq } from "drizzle-orm"
import type { SelectResumeVersion } from "@/db/schema/resume-versions"

export async function getVersionsByProjectId(
  projectId: string
): Promise<SelectResumeVersion[]> {
  const user = await currentUser()
  if (!user) return []
  const project = await getProjectById(projectId)
  if (!project) return []
  return db.query.resumeVersions.findMany({
    where: eq(resumeVersions.projectId, projectId),
    orderBy: [desc(resumeVersions.versionNumber)]
  })
}

export async function getVersionById(
  versionId: string
): Promise<SelectResumeVersion | null> {
  const user = await currentUser()
  if (!user) return null
  const [v] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.id, versionId))
  if (!v) return null
  const project = await getProjectById(v.projectId)
  return project ? v : null
}
