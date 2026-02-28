import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  jobPostingUrl: text("job_posting_url"),
  jobPostingText: text("job_posting_text"),
  interactionCount: integer("interaction_count").default(0).notNull(),
  interactionCap: integer("interaction_cap").default(25).notNull(),
  lastScoreTimestamp: timestamp("last_score_timestamp"),
  lastScoreResumeVersionId: uuid("last_score_resume_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertProject = typeof projects.$inferInsert
export type SelectProject = typeof projects.$inferSelect
