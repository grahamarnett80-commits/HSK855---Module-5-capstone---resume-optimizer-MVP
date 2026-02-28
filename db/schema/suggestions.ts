import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { resumeVersions } from "./resume-versions"

export const suggestions = pgTable("suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, {
    onDelete: "cascade"
  }),
  content: text("content").notNull(),
  type: text("type"),
  originalText: text("original_text"),
  suggestedText: text("suggested_text"),
  jobPostingKeywords: text("job_posting_keywords"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertSuggestion = typeof suggestions.$inferInsert
export type SelectSuggestion = typeof suggestions.$inferSelect
