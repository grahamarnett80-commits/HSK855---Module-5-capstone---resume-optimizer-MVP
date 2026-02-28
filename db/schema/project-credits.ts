import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const projectCreditBalance = pgTable("project_credit_balance", {
  userId: text("user_id").primaryKey(),
  balance: integer("balance").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertProjectCreditBalance = typeof projectCreditBalance.$inferInsert
export type SelectProjectCreditBalance = typeof projectCreditBalance.$inferSelect
