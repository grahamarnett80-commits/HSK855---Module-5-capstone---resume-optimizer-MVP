import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { projects } from "./projects"

export const interactionType = pgEnum("interaction_type", [
  "chat",
  "suggestions",
  "score_refresh"
])

export const interactionEvents = pgTable("interaction_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: interactionType("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertInteractionEvent = typeof interactionEvents.$inferInsert
export type SelectInteractionEvent = typeof interactionEvents.$inferSelect
