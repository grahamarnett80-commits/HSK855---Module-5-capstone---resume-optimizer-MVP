import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { projects } from "./projects"

export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"), // pdf, docx, txt
  score: integer("score"), // 0-100
  scoreBreakdown: jsonb("score_breakdown"), // { skills?, experience?, keywords?, format? }
  scoredAt: timestamp("scored_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertResumeVersion = typeof resumeVersions.$inferInsert
export type SelectResumeVersion = typeof resumeVersions.$inferSelect
