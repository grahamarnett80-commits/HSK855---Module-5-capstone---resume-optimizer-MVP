"use server"

import { db } from "@/db"
import { chatMessages } from "@/db/schema/chat-messages"
import { getProjectById } from "@/actions/projects"
import { resumeVersions } from "@/db/schema/resume-versions"
import { runChat } from "@/lib/ai/client"
import { currentUser } from "@clerk/nextjs/server"
import { asc, desc, eq } from "drizzle-orm"

export async function getChatMessages(
  projectId: string
): Promise<{ success: boolean; messages?: { role: string; content: string }[]; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const project = await getProjectById(projectId)
  if (!project) return { success: false, error: "Project not found" }
  const rows = await db.query.chatMessages.findMany({
    where: eq(chatMessages.projectId, projectId),
    orderBy: [asc(chatMessages.createdAt)]
  })
  return {
    success: true,
    messages: rows.map((r) => ({ role: r.role, content: r.content }))
  }
}

export type SuggestionContext = {
  text: string
  originalText: string
  suggestedText: string
} | null

export async function sendChatMessage(
  projectId: string,
  content: string,
  suggestionContext?: SuggestionContext
): Promise<{ success: boolean; reply?: string; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const project = await getProjectById(projectId)
  if (!project) return { success: false, error: "Project not found" }

  await db.insert(chatMessages).values({ projectId, role: "user", content })

  const history = await db.query.chatMessages.findMany({
    where: eq(chatMessages.projectId, projectId),
    orderBy: [asc(chatMessages.createdAt)]
  })
  const messages = history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

  const [latestVersion] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.projectId, projectId))
    .orderBy(desc(resumeVersions.versionNumber))
  const resumeContent = latestVersion?.content ?? ""
  const jobText = project.jobPostingText ?? ""

  let contextPrefix = ""
  if (suggestionContext) {
    contextPrefix = `\n\n[SUGGESTION CONTEXT]\nSuggestion: ${suggestionContext.text}\nOriginal resume text: ${suggestionContext.originalText}\nProposed change: ${suggestionContext.suggestedText}\n[/SUGGESTION CONTEXT]\n`
  }

  const reply = await runChat(jobText, resumeContent + contextPrefix, messages)
  await db.insert(chatMessages).values({ projectId, role: "assistant", content: reply })

  return { success: true, reply }
}
