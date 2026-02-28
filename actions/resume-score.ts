"use server"

import { db } from "@/db"
import { resumeVersions } from "@/db/schema/resume-versions"
import { getProjectById } from "@/actions/projects"
import { runScoring } from "@/lib/ai/client"
import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

export async function scoreResumeVersion(
  versionId: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.id, versionId))

  if (!version) return { success: false, error: "Version not found" }

  const project = await getProjectById(version.projectId)
  if (!project) return { success: false, error: "Project not found" }

  const jobText = project.jobPostingText?.trim() ?? ""
  if (!jobText) return { success: false, error: "No job posting text to score against." }

  try {
    const result = await runScoring(jobText, version.content)
    await db
      .update(resumeVersions)
      .set({
        score: result.score,
        scoreBreakdown: result.breakdown,
        scoredAt: new Date()
      })
      .where(eq(resumeVersions.id, versionId))
    return { success: true, score: result.score }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("Scoring error:", msg)
    return { success: false, error: `Scoring failed: ${msg}` }
  }
}
