import { db } from "@/db"
import { customers } from "@/db/schema/customers"
import { interactionEvents } from "@/db/schema/interaction-events"
import { packPurchases } from "@/db/schema/pack-purchases"
import { projectCreditBalance } from "@/db/schema/project-credits"
import { projects } from "@/db/schema/projects"
import { resumeVersions } from "@/db/schema/resume-versions"
import { eq, sql } from "drizzle-orm"

const SCORE_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes
const MIN_EDIT_DELTA_CHARS = 50

export type InteractionType = "chat" | "suggestions" | "score_refresh"

/** Pack sizes and their interaction caps for new projects. */
export const PACK_CAPS = {
  3: 50,
  10: 75,
  25: 100
} as const

export async function getCreditBalance(userId: string): Promise<number> {
  const [row] = await db
    .select()
    .from(projectCreditBalance)
    .where(eq(projectCreditBalance.userId, userId))
  return row?.balance ?? 0
}

/** Consume one project credit. Returns true if consumed, false if insufficient. */
export async function consumeCredit(userId: string): Promise<boolean> {
  const result = await db
    .update(projectCreditBalance)
    .set({
      balance: sql`${projectCreditBalance.balance} - 1`,
      updatedAt: new Date()
    })
    .where(eq(projectCreditBalance.userId, userId))
    .where(sql`${projectCreditBalance.balance} >= 1`)
    .returning({ userId: projectCreditBalance.userId })
  return result.length > 0
}

/** Ensure a row exists for userId; add credits (for webhook). */
export async function grantCredits(userId: string, amount: number): Promise<void> {
  const updated = await db
    .update(projectCreditBalance)
    .set({
      balance: sql`${projectCreditBalance.balance} + ${amount}`,
      updatedAt: new Date()
    })
    .where(eq(projectCreditBalance.userId, userId))
    .returning({ userId: projectCreditBalance.userId })
  if (updated.length === 0) {
    await db
      .insert(projectCreditBalance)
      .values({ userId, balance: amount, updatedAt: new Date() })
  }
}

export async function getProjectInteractionState(projectId: string): Promise<{
  count: number
  cap: number
} | null> {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId))
  if (!p) return null
  return { count: p.interactionCount, cap: p.interactionCap }
}

/** Returns whether an AI action is allowed and current count/cap. */
export async function checkInteractionCap(projectId: string): Promise<{
  allowed: boolean
  count: number
  cap: number
}> {
  const state = await getProjectInteractionState(projectId)
  if (!state) return { allowed: false, count: 0, cap: 25 }
  const allowed = state.count < state.cap
  return { allowed, count: state.count, cap: state.cap }
}

/** Record one interaction and increment project count. Call after successful AI call. */
export async function recordInteraction(
  projectId: string,
  type: InteractionType
): Promise<void> {
  await db.insert(interactionEvents).values({ projectId, type })
  await db
    .update(projects)
    .set({
      interactionCount: sql`${projects.interactionCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(projects.id, projectId))
}

/** For score refresh: check cooldown and edit delta. Returns { allowed, reason }. */
export async function canRefreshScore(
  projectId: string,
  versionId: string,
  currentResumeContent: string
): Promise<{ allowed: boolean; reason?: string }> {
  const capCheck = await checkInteractionCap(projectId)
  if (!capCheck.allowed) {
    return { allowed: false, reason: "interaction_cap" }
  }

  const [p] = await db.select().from(projects).where(eq(projects.id, projectId))
  if (!p) return { allowed: false, reason: "project_not_found" }

  const now = Date.now()
  const lastTs = p.lastScoreTimestamp?.getTime()
  if (lastTs != null && now - lastTs < SCORE_COOLDOWN_MS) {
    const waitSec = Math.ceil((SCORE_COOLDOWN_MS - (now - lastTs)) / 1000)
    return { allowed: false, reason: "cooldown", cooldownSeconds: waitSec }
  }

  const lastVersionId = p.lastScoreResumeVersionId
  if (lastVersionId === versionId) {
    const [lastVersion] = await db
      .select({ content: resumeVersions.content })
      .from(resumeVersions)
      .where(eq(resumeVersions.id, lastVersionId))
    const lastContent = lastVersion?.content ?? ""
    const delta = Math.abs(currentResumeContent.length - lastContent.length)
    const hasSubstantiveEdit =
      currentResumeContent.trim() !== lastContent.trim() && delta >= MIN_EDIT_DELTA_CHARS
    if (!hasSubstantiveEdit && delta < MIN_EDIT_DELTA_CHARS) {
      return {
        allowed: false,
        reason: "edit_delta",
        message: `Make at least ${MIN_EDIT_DELTA_CHARS} characters of changes before refreshing the score.`
      }
    }
  }

  return { allowed: true }
}

/** Update project last score metadata after a successful score. */
export async function setLastScoreMetadata(
  projectId: string,
  versionId: string
): Promise<void> {
  await db
    .update(projects)
    .set({
      lastScoreTimestamp: new Date(),
      lastScoreResumeVersionId: versionId,
      updatedAt: new Date()
    })
    .where(eq(projects.id, projectId))
}

/** Best interaction cap for new projects from user's pack purchases (50, 75, or 100). Default 25 for free. */
export async function getInteractionCapForNewProject(userId: string): Promise<number> {
  const purchases = await db
    .select({ packSize: packPurchases.packSize })
    .from(packPurchases)
    .where(eq(packPurchases.userId, userId))
  if (purchases.length === 0) return 25
  const maxPack = Math.max(...purchases.map((r) => r.packSize))
  return PACK_CAPS[maxPack as keyof typeof PACK_CAPS] ?? 25
}

/** Whether user can export (has any pack purchase = any project with cap > 25 or has credits). */
export async function canExport(userId: string): Promise<boolean> {
  const [balance] = await db
    .select()
    .from(projectCreditBalance)
    .where(eq(projectCreditBalance.userId, userId))
  if ((balance?.balance ?? 0) > 0) return true
  const purchases = await db
    .select({ id: packPurchases.id })
    .from(packPurchases)
    .where(eq(packPurchases.userId, userId))
  return purchases.length > 0
}

export async function getFreeProjectUsed(userId: string): Promise<boolean> {
  const [c] = await db.select().from(customers).where(eq(customers.userId, userId))
  return c?.freeProjectUsed ?? false
}

export async function setFreeProjectUsed(userId: string): Promise<void> {
  const updated = await db
    .update(customers)
    .set({ freeProjectUsed: true, updatedAt: new Date() })
    .where(eq(customers.userId, userId))
    .returning()
  if (updated.length === 0) {
    await db.insert(customers).values({
      userId,
      membership: "free",
      freeProjectUsed: true
    })
  }
}
