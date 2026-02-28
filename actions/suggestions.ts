"use server"

import { db } from "@/db"
import { suggestions as suggestionsTable } from "@/db/schema/suggestions"
import { resumeVersions } from "@/db/schema/resume-versions"
import { getProjectById } from "@/actions/projects"
import { runSuggestions } from "@/lib/ai/client"
import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

export type SuggestionItem = { id: string; type: string | null; section: string; text: string }

export async function getSuggestionsForVersion(
  versionId: string
): Promise<{ success: boolean; suggestions?: SuggestionItem[]; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const rows = await db.query.suggestions.findMany({
    where: eq(suggestionsTable.resumeVersionId, versionId)
  })
  const suggestions: SuggestionItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    section: "",
    text: r.content
  }))
  return { success: true, suggestions }
}

export async function generateSuggestionsForVersion(
  versionId: string
): Promise<{ success: boolean; suggestions?: SuggestionItem[]; error?: string }> {
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
  if (!jobText) return { success: false, error: "No job posting to suggest against." }

  try {
    const items = await runSuggestions(jobText, version.content)
    // Clear old suggestions for this version and insert new
    await db.delete(suggestionsTable).where(eq(suggestionsTable.resumeVersionId, versionId))
    if (items.length > 0) {
      const inserted = await db
        .insert(suggestionsTable)
        .values(
          items.map((i) => ({
            resumeVersionId: versionId,
            content: `${i.section ? `[${i.section}] ` : ""}${i.text}`,
            type: i.type
          }))
        )
        .returning()
      return {
        success: true,
        suggestions: inserted.map((r) => ({ id: r.id, type: r.type, section: "", text: r.content }))
      }
    }
    return { success: true, suggestions: [] }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Failed to generate suggestions." }
  }
}
