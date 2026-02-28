import { config } from "dotenv"
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { chatMessages } from "./schema/chat-messages"
import { customers } from "./schema/customers"
import { interactionEvents } from "./schema/interaction-events"
import { packPurchases } from "./schema/pack-purchases"
import { projectCreditBalance } from "./schema/project-credits"
import { projects } from "./schema/projects"
import { resumeVersions } from "./schema/resume-versions"
import { suggestions } from "./schema/suggestions"

config({ path: ".env.local" })

const dbSchema = {
  customers,
  projects,
  resumeVersions,
  suggestions,
  chatMessages,
  packPurchases,
  projectCreditBalance,
  interactionEvents
}

function initializeDb(url: string) {
  const client = postgres(url, { prepare: false })
  return drizzlePostgres(client, { schema: dbSchema })
}

let _db: ReturnType<typeof initializeDb> | null = null

function getDb() {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) throw new Error("DATABASE_URL is not set")
    _db = initializeDb(databaseUrl)
  }
  return _db
}

export const db = new Proxy({} as ReturnType<typeof initializeDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof initializeDb>]
  }
})
