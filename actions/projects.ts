"use server"

import {
  canExport,
  consumeCredit,
  getCreditBalance,
  getFreeProjectUsed,
  getInteractionCapForNewProject,
  getProjectInteractionState,
  setFreeProjectUsed
} from "@/lib/entitlements"
import { db } from "@/db"
import { projects as projectsTable, type InsertProject, type SelectProject } from "@/db/schema/projects"
import { createCustomer, getCustomerByUserId } from "@/actions/customers"
import { currentUser } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"

export async function getCreditsForCurrentUser(): Promise<{
  balance: number
  freeProjectUsed: boolean
} | null> {
  const user = await currentUser()
  if (!user) return null
  const balance = await getCreditBalance(user.id)
  const freeProjectUsed = await getFreeProjectUsed(user.id)
  return { balance, freeProjectUsed }
}

export async function getProjectsByUserId(): Promise<SelectProject[]> {
  const user = await currentUser()
  if (!user) return []
  const list = await db.query.projects.findMany({
    where: eq(projectsTable.userId, user.id),
    orderBy: [desc(projectsTable.updatedAt)]
  })
  return list
}

export async function getProjectById(projectId: string): Promise<SelectProject | null> {
  const user = await currentUser()
  if (!user) return null
  const project = await db.query.projects.findFirst({
    where: and(eq(projectsTable.id, projectId), eq(projectsTable.userId, user.id))
  })
  return project ?? null
}

const JOB_POSTING_FETCH_TIMEOUT_MS = 15_000
const JOB_POSTING_MAX_CHARS = 80_000

/** Fetch a URL and extract plain text from HTML for use as job posting content. */
export async function fetchJobPostingFromUrl(url: string): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  const trimmed = url.trim()
  if (!trimmed) return { success: false, error: "Please enter a URL." }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { success: false, error: "Invalid URL." }
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { success: false, error: "URL must be http or https." }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), JOB_POSTING_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(trimmed, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobPostingBot/1.0; +https://github.com/resume-optimizer)"
      },
      redirect: "follow"
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return { success: false, error: `Could not load page (${res.status}). Try copying the job description and pasting it instead.` }
    }
    const html = await res.text()
    const text = htmlToPlainText(html).slice(0, JOB_POSTING_MAX_CHARS)
    if (!text.trim()) {
      return { success: false, error: "No text could be extracted from this page. Try copying and pasting the job description." }
    }
    return { success: true, text }
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error) {
      if (err.name === "AbortError")
        return { success: false, error: "Request timed out. Try copying and pasting the job description." }
      return { success: false, error: err.message || "Failed to fetch URL." }
    }
    return { success: false, error: "Failed to fetch URL." }
  }
}

function htmlToPlainText(html: string): string {
  let s = html
  // Remove script and style and their contents
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  // Block elements: replace with newline so we get paragraph breaks
  s = s.replace(/<\/?(?:p|div|br|tr|li|h[1-6])\b[^>]*>/gi, "\n")
  // Remove all remaining tags
  s = s.replace(/<[^>]+>/g, " ")
  // Decode common entities
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
  // Collapse runs of whitespace and trim
  s = s.replace(/\s+/g, " ").trim()
  return s
}

export async function createProject(input: {
  name: string
  jobPostingUrl?: string
  jobPostingText?: string
}): Promise<{
  success: boolean
  project?: SelectProject
  error?: string
  code?: "no_credits"
}> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  let jobPostingText = input.jobPostingText?.trim() ?? ""
  const jobPostingUrl = input.jobPostingUrl?.trim() ?? ""

  if (!jobPostingText && jobPostingUrl) {
    const fetched = await fetchJobPostingFromUrl(jobPostingUrl)
    if (!fetched.success) {
      return { success: false, error: fetched.error ?? "Could not fetch job posting from URL." }
    }
    jobPostingText = fetched.text ?? ""
  }

  if (!jobPostingText && !jobPostingUrl) {
    return { success: false, error: "Please paste the job posting or enter a URL." }
  }

  let customer = await getCustomerByUserId(user.id)
  if (!customer) {
    const createResult = await createCustomer(user.id)
    if (!createResult.isSuccess || !createResult.data)
      return { success: false, error: "Failed to create profile" }
    customer = createResult.data
  }

  const freeUsed = await getFreeProjectUsed(user.id)
  const cap = await getInteractionCapForNewProject(user.id)

  if (!freeUsed) {
    await setFreeProjectUsed(user.id)
    const [project] = await db
      .insert(projectsTable)
      .values({
        userId: user.id,
        name: input.name,
        jobPostingUrl: jobPostingUrl || null,
        jobPostingText: jobPostingText || null,
        interactionCap: 25,
        interactionCount: 0
      })
      .returning()
    if (!project) return { success: false, error: "Failed to create project" }
    return { success: true, project }
  }

  const balance = await getCreditBalance(user.id)
  if (balance < 1) {
    return {
      success: false,
      error: "No project credits. Get a project pack to create more projects.",
      code: "no_credits"
    }
  }

  const consumed = await consumeCredit(user.id)
  if (!consumed) {
    return {
      success: false,
      error: "Could not use a project credit. Try again.",
      code: "no_credits"
    }
  }

  try {
    const [project] = await db
      .insert(projectsTable)
      .values({
        userId: user.id,
        name: input.name,
        jobPostingUrl: jobPostingUrl || null,
        jobPostingText: jobPostingText || null,
        interactionCap: cap,
        interactionCount: 0
      })
      .returning()
    if (!project) return { success: false, error: "Failed to create project" }
    return { success: true, project }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Failed to create project" }
  }
}

export async function getProjectUsage(
  projectId: string
): Promise<{ count: number; cap: number } | null> {
  const user = await currentUser()
  if (!user) return null
  const project = await getProjectById(projectId)
  if (!project) return null
  return getProjectInteractionState(projectId)
}

export async function getExportAllowed(): Promise<{ allowed: boolean }> {
  const user = await currentUser()
  if (!user) return { allowed: false }
  const allowed = await canExport(user.id)
  return { allowed }
}

export async function updateProject(
  projectId: string,
  input: Partial<Pick<InsertProject, "name" | "jobPostingUrl" | "jobPostingText">>
): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const existing = await getProjectById(projectId)
  if (!existing) return { success: false, error: "Project not found" }
  try {
    await db
      .update(projectsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projectsTable.id, projectId))
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Failed to update project" }
  }
}

/** Delete a project. Does not change the user's project credit balance. */
export async function deleteProject(projectId: string): Promise<{
  success: boolean
  error?: string
}> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const project = await getProjectById(projectId)
  if (!project) return { success: false, error: "Project not found" }
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, projectId))
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Failed to delete project" }
  }
}
