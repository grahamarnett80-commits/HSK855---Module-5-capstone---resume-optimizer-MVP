"use server"

import { db } from "@/db"
import { resumeVersions } from "@/db/schema/resume-versions"
import { getProjectById } from "@/actions/projects"
import { getSupabaseServer, RESUMES_BUCKET } from "@/lib/supabase"
import { extractTextFromBuffer, ALLOWED_RESUME_TYPES } from "@/lib/parse-resume"
import { currentUser } from "@clerk/nextjs/server"
import { eq, desc } from "drizzle-orm"

export type UploadResult =
  | { success: true; versionId: string }
  | { success: false; error: string }

export async function uploadResume(
  projectId: string,
  formData: FormData
): Promise<UploadResult> {
  const user = await currentUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const project = await getProjectById(projectId)
  if (!project) return { success: false, error: "Project not found" }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { success: false, error: "No file provided" }

  const mime = file.type
  if (!ALLOWED_RESUME_TYPES.includes(mime as (typeof ALLOWED_RESUME_TYPES)[number])) {
    return { success: false, error: "Only PDF, Word (.docx/.doc), or TXT files are allowed." }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let content: string
  try {
    content = await extractTextFromBuffer(buffer, mime)
  } catch (e) {
    console.error(e)
    return { success: false, error: "Could not extract text from this file." }
  }

  if (!content.trim()) {
    return { success: false, error: "No text could be extracted from the file." }
  }

  let fileUrl: string | null = null
  try {
    const supabase = getSupabaseServer()
    const ext = mime === "application/pdf" ? "pdf" : mime.includes("word") ? "docx" : "txt"
    const path = `${projectId}/${Date.now()}-resume.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(RESUMES_BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false })
    if (uploadError) {
      console.error("Supabase Storage upload failed (bucket may not exist):", uploadError.message)
    } else {
      const { data: urlData } = supabase.storage.from(RESUMES_BUCKET).getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }
  } catch (e) {
    console.error("Supabase Storage unavailable:", e)
  }

  const existingVersions = await db.query.resumeVersions.findMany({
    where: eq(resumeVersions.projectId, projectId),
    columns: { versionNumber: true },
    orderBy: [desc(resumeVersions.versionNumber)]
  })
  const nextVersion = existingVersions[0]?.versionNumber != null ? existingVersions[0].versionNumber + 1 : 1

  const [version] = await db
    .insert(resumeVersions)
    .values({
      projectId,
      versionNumber: nextVersion,
      content,
      fileUrl,
      fileType: mime.includes("pdf") ? "pdf" : mime.includes("word") ? "docx" : "txt"
    })
    .returning()

  if (!version) return { success: false, error: "Failed to save version." }
  return { success: true, versionId: version.id }
}
