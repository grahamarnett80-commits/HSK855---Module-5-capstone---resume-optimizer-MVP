/**
 * Extract plain text from resume file buffers (PDF, DOCX, TXT).
 * Used server-side only.
 */

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const type = mimeType.toLowerCase()
  if (type === "application/pdf") {
    return extractFromPdf(buffer)
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/msword"
  ) {
    return extractFromDocx(buffer)
  }
  if (type === "text/plain") {
    return buffer.toString("utf-8")
  }
  throw new Error(`Unsupported file type: ${mimeType}`)
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse")
  const parser = new PDFParse({ data: buffer })
  try {
    const textResult = await parser.getText()
    return typeof textResult?.text === "string" ? textResult.text.trim() : ""
  } finally {
    await parser.destroy()
  }
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return (result.value || "").trim()
}

export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain"
] as const

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"] as const
