import { GoogleGenerativeAI } from "@google/generative-ai"

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set")
  return new GoogleGenerativeAI(key)
}

const MODEL = "gemini-2.5-flash-lite"

export async function runScoring(
  jobPostingText: string,
  resumeContent: string
): Promise<{ score: number; breakdown: Record<string, string>; shortExplanation: string }> {
  const genAI = getClient()
  const { SCORING_SYSTEM } = await import("./prompts")
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SCORING_SYSTEM,
    generationConfig: { responseMimeType: "application/json" }
  })
  const res = await model.generateContent(
    `Job posting:\n${jobPostingText.slice(0, 12000)}\n\nResume:\n${resumeContent.slice(0, 8000)}`
  )
  const raw = res.response.text()
  if (!raw) throw new Error("No response from AI")
  const parsed = JSON.parse(raw) as {
    score?: number
    breakdown?: Record<string, string>
    shortExplanation?: string
  }
  return {
    score: Math.min(100, Math.max(0, Number(parsed.score) ?? 0)),
    breakdown: parsed.breakdown ?? {},
    shortExplanation: String(parsed.shortExplanation ?? "")
  }
}

export type AISuggestion = {
  type: string
  section: string
  text: string
  originalText: string
  suggestedText: string
  jobPostingKeywords: string[]
}

export async function runSuggestions(
  jobPostingText: string,
  resumeContent: string
): Promise<AISuggestion[]> {
  const genAI = getClient()
  const { SUGGESTIONS_SYSTEM } = await import("./prompts")
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SUGGESTIONS_SYSTEM,
    generationConfig: { responseMimeType: "application/json" }
  })
  const res = await model.generateContent(
    `Job posting:\n${jobPostingText.slice(0, 12000)}\n\nResume:\n${resumeContent.slice(0, 8000)}`
  )
  const raw = res.response.text()
  if (!raw) return []
  const parsed = JSON.parse(raw) as { suggestions?: AISuggestion[] }
  if (!Array.isArray(parsed.suggestions)) return []
  return parsed.suggestions.map((s) => ({
    type: s.type ?? "other",
    section: s.section ?? "",
    text: s.text ?? "",
    originalText: s.originalText ?? "",
    suggestedText: s.suggestedText ?? "",
    jobPostingKeywords: Array.isArray(s.jobPostingKeywords) ? s.jobPostingKeywords : []
  }))
}

export async function runChat(
  jobPostingText: string,
  resumeContent: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const genAI = getClient()
  const { CHAT_SYSTEM } = await import("./prompts")
  const systemContent = `${CHAT_SYSTEM}\n\nCurrent job posting (excerpt):\n${jobPostingText.slice(0, 3000)}\n\nCurrent resume (excerpt):\n${resumeContent.slice(0, 3000)}`
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemContent
  })
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }]
  }))
  const lastMessage = messages[messages.length - 1]
  const chat = model.startChat({ history })
  const res = await chat.sendMessage(lastMessage?.content ?? "")
  return res.response.text() ?? ""
}
