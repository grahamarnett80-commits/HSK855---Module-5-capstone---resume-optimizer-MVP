import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  jobPostingUrl: text("job_posting_url"),
  jobPostingText: text("job_posting_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertProject = typeof projects.$inferInsert
export type SelectProject = typeof projects.$inferSelect
