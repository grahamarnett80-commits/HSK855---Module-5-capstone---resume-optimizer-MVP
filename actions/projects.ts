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
        jobPostingUrl: input.jobPostingUrl ?? null,
        jobPostingText: input.jobPostingText ?? null,
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
        jobPostingUrl: input.jobPostingUrl ?? null,
        jobPostingText: input.jobPostingText ?? null,
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
