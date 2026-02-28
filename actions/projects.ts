"use server"

import { db } from "@/db"
import { projects as projectsTable, type InsertProject, type SelectProject } from "@/db/schema/projects"
import { currentUser } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"

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
}): Promise<{ success: boolean; project?: SelectProject; error?: string }> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  try {
    const [project] = await db
      .insert(projectsTable)
      .values({
        userId: user.id,
        name: input.name,
        jobPostingUrl: input.jobPostingUrl ?? null,
        jobPostingText: input.jobPostingText ?? null
      })
      .returning()
    if (!project) return { success: false, error: "Failed to create project" }
    return { success: true, project }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Failed to create project" }
  }
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
