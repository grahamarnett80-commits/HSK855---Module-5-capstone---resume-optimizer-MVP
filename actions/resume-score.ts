"use server"

import { db } from "@/db"
import { resumeVersions } from "@/db/schema/resume-versions"
import { getProjectById } from "@/actions/projects"
import {
  canRefreshScore,
  checkInteractionCap,
  recordInteraction,
  setLastScoreMetadata
} from "@/lib/entitlements"
import { runScoring } from "@/lib/ai/client"
import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

export async function scoreResumeVersion(
  versionId: string
): Promise<{
  success: boolean
  score?: number
  error?: string
  code?: "interaction_cap" | "cooldown" | "edit_delta"
}> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.id, versionId))

  if (!version) return { success: false, error: "Version not found" }

  const project = await getProjectById(version.projectId)
  if (!project) return { success: false, error: "Project not found" }

  const capCheck = await checkInteractionCap(project.id)
  if (!capCheck.allowed) {
    return {
      success: false,
      error: `You've used all ${capCheck.cap} AI uses for this project. Editing stays available; add a project pack for more.`,
      code: "interaction_cap"
    }
  }

  const refreshCheck = await canRefreshScore(
    project.id,
    versionId,
    version.content
  )
  if (!refreshCheck.allowed) {
    if (refreshCheck.reason === "cooldown" && "cooldownSeconds" in refreshCheck) {
      return {
        success: false,
        error: `Wait ${(refreshCheck as { cooldownSeconds?: number }).cooldownSeconds} seconds before refreshing the score again.`,
        code: "cooldown"
      }
    }
    if (refreshCheck.reason === "edit_delta") {
      return {
        success: false,
        error:
          (refreshCheck as { message?: string }).message ??
          "Make at least 50 characters of changes before refreshing the score.",
        code: "edit_delta"
      }
    }
    return { success: false, error: "Score refresh not allowed." }
  }

  const jobText = project.jobPostingText?.trim() ?? ""
  if (!jobText) return { success: false, error: "No job posting text to score against." }

  try {
    const result = await runScoring(jobText, version.content)
    await recordInteraction(project.id, "score_refresh")
    await setLastScoreMetadata(project.id, versionId)
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
