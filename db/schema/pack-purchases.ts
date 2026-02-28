import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const packPurchases = pgTable("pack_purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  packSize: integer("pack_size").notNull(), // 3 | 10 | 25
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertPackPurchase = typeof packPurchases.$inferInsert
export type SelectPackPurchase = typeof packPurchases.$inferSelect
