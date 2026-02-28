"use server"

import { db } from "@/db"
import { resumeVersions } from "@/db/schema/resume-versions"
import { getProjectById } from "@/actions/projects"
import { scoreResumeVersion } from "@/actions/resume-score"
import { currentUser } from "@clerk/nextjs/server"
import { desc, eq } from "drizzle-orm"

export async function createNewVersionFromContent(
  projectId: string,
  content: string
): Promise<{ success: boolean; versionId?: string; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const project = await getProjectById(projectId)
  if (!project) return { success: false, error: "Project not found" }

  const [last] = await db
    .select({ versionNumber: resumeVersions.versionNumber })
    .from(resumeVersions)
    .where(eq(resumeVersions.projectId, projectId))
    .orderBy(desc(resumeVersions.versionNumber))

  const nextNum = (last?.versionNumber ?? 0) + 1
  const [version] = await db
    .insert(resumeVersions)
    .values({
      projectId,
      versionNumber: nextNum,
      content: content.trim()
    })
    .returning()

  if (!version) return { success: false, error: "Failed to create version" }
  await scoreResumeVersion(version.id)
  return { success: true, versionId: version.id }
}
