import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-side Supabase client with service role for Storage (resume uploads).
 *
 * Setup: In Supabase Dashboard > Storage, create a bucket named "resumes".
 * You can make it private and use RLS, or leave public for MVP.
 * If Supabase env vars are not set, uploads will still create DB versions but fileUrl will be null.
 */
export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for file uploads")
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export const RESUMES_BUCKET = "resumes"
