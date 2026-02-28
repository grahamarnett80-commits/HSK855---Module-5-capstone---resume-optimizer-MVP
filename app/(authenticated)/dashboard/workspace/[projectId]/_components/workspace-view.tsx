"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Group, Panel, Separator } from "react-resizable-panels"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  uploadResume,
  type UploadResult
} from "@/actions/resume-upload"
import { scoreResumeVersion } from "@/actions/resume-score"
import { getSuggestionsForVersion, generateSuggestionsForVersion, type SuggestionItem } from "@/actions/suggestions"
import { sendChatMessage, type SuggestionContext } from "@/actions/chat"
import { createNewVersionFromContent } from "@/actions/resume-save-version"
import { getVersionsByProjectId } from "@/actions/resume-versions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Loader2, Send, Upload, Sparkles, Save, Check, X, CheckCheck, Undo2, MessageCircleQuestion, Download, FileText } from "lucide-react"
import { HighlightedJobPosting } from "./highlighted-job-posting"

type Version = {
  id: string
  versionNumber: number
  content: string
  score: number | null
  scoredAt: string | null
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  section_rewrite: { label: "Rewrite", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-400" },
  keyword_add: { label: "Keyword", className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-400" },
  quantify: { label: "Quantify", className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-400" },
  clarify: { label: "Clarify", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400" },
  other: { label: "Other", className: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-400" }
}

function SuggestionBadge({ type }: { type: string | null }) {
  const badge = TYPE_BADGE[type ?? "other"] ?? TYPE_BADGE.other
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${badge.className}`}>
      {badge.label}
    </span>
  )
}

export function WorkspaceView({
  project,
  versions: initialVersions
}: {
  project: { id: string; name: string; jobPostingText: string }
  versions: Version[]
}) {
  const [versions, setVersions] = useState(initialVersions)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    initialVersions[0]?.id ?? null
  )
  const [resumeContent, setResumeContent] = useState(
    initialVersions[0]?.content ?? ""
  )
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<{ suggestion: SuggestionItem; contentBefore: string }[]>([])

  const currentVersion = versions.find((v) => v.id === selectedVersionId)

  const activeSuggestion = useMemo(
    () => suggestions.find((s) => s.id === activeSuggestionId) ?? null,
    [suggestions, activeSuggestionId]
  )

  const activeKeywords = useMemo(
    () => activeSuggestion?.jobPostingKeywords ?? [],
    [activeSuggestion]
  )

  const dedupeById = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>()
    return items.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [])

  const loadSuggestions = useCallback(async () => {
    if (!selectedVersionId) return
    const res = await getSuggestionsForVersion(selectedVersionId)
    if (res.success && res.suggestions) {
      setSuggestions(dedupeById(res.suggestions))
    }
  }, [selectedVersionId, dedupeById])

  useEffect(() => {
    if (selectedVersionId) loadSuggestions()
  }, [selectedVersionId, loadSuggestions])

  useEffect(() => {
    if (currentVersion) {
      setResumeContent(currentVersion.content)
      setUndoStack([])
    }
  }, [currentVersion])

  const resumeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const latestResumeContentRef = useRef(resumeContent)
  latestResumeContentRef.current = resumeContent

  useEffect(() => {
    if (!activeSuggestion?.originalText || !resumeContent.includes(activeSuggestion.originalText)) return
    const el = resumeTextareaRef.current
    if (!el) return
    const start = resumeContent.indexOf(activeSuggestion.originalText)
    const end = start + activeSuggestion.originalText.length
    el.focus()
    el.setSelectionRange(start, end)
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20
    const linesBefore = (resumeContent.slice(0, start).match(/\n/g) ?? []).length
    el.scrollTop = Math.max(0, linesBefore * lineHeight - el.clientHeight / 3)
  }, [activeSuggestion?.id, activeSuggestion?.originalText, resumeContent])

  function handleAcceptSuggestion(s: SuggestionItem) {
    if (s.originalText && s.suggestedText && resumeContent.includes(s.originalText)) {
      const contentBefore = resumeContent
      setResumeContent((prev) => prev.replace(s.originalText, s.suggestedText))
      setUndoStack((prev) => [...prev, { suggestion: s, contentBefore }])
      toast.success("Suggestion applied.", {
        action: {
          label: "Undo",
          onClick: () => handleUndoLast()
        },
        duration: 8000
      })
    } else {
      toast.error("Could not find the original text in your resume. It may have already been modified.")
    }
    const remaining = suggestions.filter((x) => x.id !== s.id)
    setSuggestions(remaining)
    setActiveSuggestionId(null)
  }

  function handleDismissSuggestion(s: SuggestionItem) {
    const remaining = suggestions.filter((x) => x.id !== s.id)
    setSuggestions(remaining)
    setActiveSuggestionId(null)
  }

  function handleAcceptAll() {
    const contentBefore = resumeContent
    let content = resumeContent
    let applied = 0
    const appliedSuggestions: SuggestionItem[] = []
    for (const s of suggestions) {
      if (s.originalText && s.suggestedText && content.includes(s.originalText)) {
        content = content.replace(s.originalText, s.suggestedText)
        appliedSuggestions.push(s)
        applied++
      }
    }
    setResumeContent(content)
    if (applied > 0) {
      setUndoStack((prev) => [
        ...prev,
        ...appliedSuggestions.map((s) => ({ suggestion: s, contentBefore }))
      ])
    }
    setSuggestions([])
    setActiveSuggestionId(null)
    toast.success(`Applied ${applied} suggestion${applied !== 1 ? "s" : ""}.`, {
      action: {
        label: "Undo all",
        onClick: () => handleUndoBatch(applied)
      },
      duration: 8000
    })
  }

  function handleUndoLast() {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setResumeContent(last.contentBefore)
      setSuggestions((s) =>
        s.some((x) => x.id === last.suggestion.id) ? s : [...s, last.suggestion]
      )
      toast.info("Change reversed.")
      return prev.slice(0, -1)
    })
  }

  function handleUndoBatch(count: number) {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const toUndo = prev.slice(-count)
      const earliest = toUndo[0]
      if (earliest) {
        setResumeContent(earliest.contentBefore)
        setSuggestions((s) => {
          const existingIds = new Set(s.map((x) => x.id))
          const toAdd = dedupeById(
            toUndo.map((u) => u.suggestion).filter((sug) => !existingIds.has(sug.id))
          )
          return toAdd.length === 0 ? s : [...s, ...toAdd]
        })
        toast.info(`Reversed ${toUndo.length} change${toUndo.length !== 1 ? "s" : ""}.`)
      }
      return prev.slice(0, -count)
    })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.set("file", file)
    const result: UploadResult = await uploadResume(project.id, formData)
    setUploading(false)
    e.target.value = ""
    if (result.success) {
      toast.success("Resume uploaded. Scoring…")
      const scoreResult = await scoreResumeVersion(result.versionId)
      if (!scoreResult.success) {
        toast.error(scoreResult.error ?? "Scoring failed.")
      }
      const raw = await getVersionsByProjectId(project.id)
      const newVersions: Version[] = raw.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        content: v.content,
        score: v.score,
        scoredAt: v.scoredAt?.toISOString() ?? null
      }))
      setVersions(newVersions)
      const newVer = newVersions.find((v) => v.id === result.versionId)
      if (newVer) {
        setResumeContent(newVer.content)
        setSelectedVersionId(result.versionId)
      }
      if (scoreResult.success && scoreResult.score != null) {
        toast.success(`Match score: ${scoreResult.score}%`, {
          description: "Generate suggestions to see how to improve your score.",
          action: {
            label: "Generate suggestions",
            onClick: () => {
              if (result.versionId) {
                setSelectedVersionId(result.versionId)
                handleGenerateSuggestions()
              }
            }
          },
          duration: 10000
        })
      }
    } else {
      toast.error(result.error)
    }
  }

  async function handleGenerateSuggestions() {
    if (!selectedVersionId) return
    setSuggestionsLoading(true)
    setActiveSuggestionId(null)
    const res = await generateSuggestionsForVersion(selectedVersionId)
    setSuggestionsLoading(false)
    if (res.success && res.suggestions) {
      setSuggestions(dedupeById(res.suggestions))
    } else {
      toast.error(res.error)
    }
  }

  const [pendingSave, setPendingSave] = useState(false)

  async function handleSaveNewVersion(bypassBracketCheck = false) {
    // Use textarea DOM value if available; otherwise use ref that's updated every render (avoids stale state)
    const contentToSave =
      (typeof resumeTextareaRef.current?.value === "string"
        ? resumeTextareaRef.current.value
        : null) ?? latestResumeContentRef.current ?? resumeContent

    if (!contentToSave.trim()) {
      toast.error("Resume content is empty.")
      return
    }
    // Check both state and live content so we never miss placeholders like [X]
    const textToCheck = contentToSave
    const bracketRe = /\[[^\]]*\]/g
    const hasPlaceholders = bracketRe.test(textToCheck)
    if (!bypassBracketCheck && hasPlaceholders) {
      const bracketMatches = textToCheck.match(/\[[^\]]*\]/g) ?? []
      const proceed = window.confirm(
        `You have ${bracketMatches.length} unresolved placeholder${bracketMatches.length !== 1 ? "s" : ""} in your resume (e.g. [X] or [Your text here]).\n\nDo you want to save anyway?`
      )
      if (!proceed) return
      await handleSaveNewVersion(true)
      return
    }
    setSaving(true)
    const res = await createNewVersionFromContent(project.id, contentToSave)
    setSaving(false)
    if (res.success && res.versionId) {
      const raw = await getVersionsByProjectId(project.id)
      const newVersions: Version[] = raw.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        content: v.content,
        score: v.score,
        scoredAt: v.scoredAt?.toISOString() ?? null
      }))
      setVersions(newVersions)
      const newVer = newVersions.find((v) => v.id === res.versionId)
      if (newVer) {
        setSelectedVersionId(res.versionId!)
        setResumeContent(newVer.content)
        if (newVer.score != null) {
          toast.success(`New version saved — Match score: ${newVer.score}%`, {
            description: "Generate suggestions to see how to improve your score.",
            action: {
              label: "Generate suggestions",
              onClick: () => handleGenerateSuggestions()
            },
            duration: 10000
          })
        } else {
          toast.success("New version saved.")
        }
      }
    } else {
      toast.error(res.error)
    }
  }

  function getCurrentResumeContent(): string {
    return (
      (typeof resumeTextareaRef.current?.value === "string"
        ? resumeTextareaRef.current.value
        : null) ?? latestResumeContentRef.current ?? resumeContent
    )
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Returns content to use for download, or null if empty or user cancelled the placeholder warning. */
  function getContentForDownload(): string | null {
    const content = getCurrentResumeContent()
    if (!content.trim()) {
      toast.error("Resume content is empty.")
      return null
    }
    const bracketMatches = content.match(/\[[^\]]*\]/g) ?? []
    if (bracketMatches.length > 0) {
      const proceed = window.confirm(
        `You have ${bracketMatches.length} unresolved placeholder${bracketMatches.length !== 1 ? "s" : ""} in your resume (e.g. [X] or [Your text here]).\n\nDo you want to download anyway?`
      )
      if (!proceed) return null
    }
    return content
  }

  function handleDownloadTxt() {
    const content = getContentForDownload()
    if (content === null) return
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    downloadBlob(blob, "resume.txt")
    toast.success("Downloaded resume.txt")
  }

  async function handleDownloadDocx() {
    const content = getContentForDownload()
    if (content === null) return
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx")
      const paragraphs = content
        .split(/\r?\n/)
        .map((line) => new Paragraph({ children: [new TextRun(line)] }))
      const doc = new Document({ sections: [{ children: paragraphs }] })
      const blob = await Packer.toBlob(doc)
      downloadBlob(blob, "resume.docx")
      toast.success("Downloaded resume.docx")
    } catch (e) {
      toast.error("Could not create Word document.")
      console.error(e)
    }
  }

  async function handleDownloadPdf() {
    const content = getContentForDownload()
    if (content === null) return
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const margin = 20
      const lineHeight = 7
      const pageHeight = doc.internal.pageSize.getHeight()
      let y = margin
      const lines = content.split(/\r?\n/)
      for (const line of lines) {
        if (y > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += lineHeight
      }
      doc.save("resume.pdf")
      toast.success("Downloaded resume.pdf")
    } catch (e) {
      toast.error("Could not create PDF.")
      console.error(e)
    }
  }

  const chatInputRef = useRef<HTMLInputElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [chatSuggestionCtx, setChatSuggestionCtx] = useState<SuggestionContext>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSessionMessages, setChatSessionMessages] = useState<{ role: string; content: string }[]>([])
  const [chatSourceSuggestionId, setChatSourceSuggestionId] = useState<string | null>(null)

  async function openChatForSuggestion(s: SuggestionItem) {
    const ctx: SuggestionContext = {
      text: s.text,
      originalText: s.originalText,
      suggestedText: s.suggestedText
    }
    setChatSuggestionCtx(ctx)
    setChatSourceSuggestionId(s.id)
    setChatInput("")
    setChatSessionMessages([
      { role: "assistant", content: `I'd like to help you review this suggestion:\n\n**"${s.text}"**\n\nThe proposed change is:\n• **Current:** ${s.originalText}\n• **Suggested:** ${s.suggestedText}\n\nHow can I help? I can:\n• Explain why this change improves your resume\n• Refine the wording to better fit your experience\n• Rewrite it with details you provide\n\nJust tell me what you'd like to do, or share more context about your experience and I'll draft an updated version.` }
    ])
    setChatOpen(true)
    setTimeout(() => chatInputRef.current?.focus(), 150)
  }

  async function openChatForBracket(bracketText: string) {
    setChatSuggestionCtx(null)
    setChatSourceSuggestionId(null)
    setChatInput("")
    setChatSessionMessages([
      { role: "assistant", content: `I see the placeholder **${bracketText}** in your resume. Let me help you fill it in.\n\nTo write something strong and specific, I'll need a few details from you. For example:\n• What was the project, task, or responsibility?\n• What actions did you take?\n• What was the result or impact?\n\nShare what you can and I'll draft the text for you.` }
    ])
    setChatOpen(true)
    setTimeout(() => chatInputRef.current?.focus(), 150)
  }

  function handleAskAboutSuggestion(s: SuggestionItem) {
    openChatForSuggestion(s)
  }

  function handleAskAboutBracket(bracketText: string) {
    openChatForBracket(bracketText)
  }

  type ChatChange = { originalText: string; suggestedText: string }

  function parseChatChange(reply: string): ChatChange | null {
    const re = /```suggestion\s*\n([\s\S]*?)\n```/
    const match = re.exec(reply)
    if (!match) return null
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.originalText && parsed.suggestedText) return parsed as ChatChange
    } catch { /* not valid JSON */ }
    return null
  }

  function stripSuggestionBlock(reply: string): string {
    return reply.replace(/```suggestion\s*\n[\s\S]*?\n```/, "").trim()
  }

  function handleApplyChatChange(change: ChatChange) {
    if (resumeContent.includes(change.originalText)) {
      const contentBefore = resumeContent
      setResumeContent((prev) => prev.replace(change.originalText, change.suggestedText))
      setUndoStack((prev) => [
        ...prev,
        {
          suggestion: {
            id: `chat-${Date.now()}`,
            type: "other",
            section: "",
            text: "Chat suggestion",
            originalText: change.originalText,
            suggestedText: change.suggestedText,
            jobPostingKeywords: []
          },
          contentBefore
        }
      ])
      if (chatSourceSuggestionId) {
        setSuggestions((prev) => prev.filter((s) => s.id !== chatSourceSuggestionId))
        setChatSourceSuggestionId(null)
      }
      toast.success("Change applied — suggestion resolved.", {
        action: { label: "Undo", onClick: () => handleUndoLast() },
        duration: 8000
      })
    } else {
      toast.error("Could not find the original text in your resume.")
    }
  }

  async function handleSendChat() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput("")
    setChatLoading(true)
    setChatSessionMessages((prev) => [...prev, { role: "user", content: text }])
    const res = await sendChatMessage(project.id, text, chatSuggestionCtx)
    setChatLoading(false)
    if (res.success && res.reply) {
      setChatSessionMessages((prev) => [...prev, { role: "assistant", content: res.reply! }])
      setTimeout(() => chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" }), 100)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex flex-wrap items-center gap-4 border-b px-2 py-2">
        <span className="font-semibold">{project.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Match score:</span>
          <span className="font-mono font-semibold">
            {currentVersion?.score != null ? `${currentVersion.score}%` : "—"}
          </span>
        </div>
        {versions.length > 0 ? (
          <select
            className="rounded border bg-background px-2 py-1 text-sm"
            value={selectedVersionId ?? ""}
            onChange={(e) => {
              const id = e.target.value
              setSelectedVersionId(id || null)
              const v = versions.find((x) => x.id === id)
              if (v) setResumeContent(v.content)
            }}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} {v.score != null ? `(${v.score}%)` : ""}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-muted-foreground text-sm">No versions yet</span>
        )}
        <div className="ml-auto flex gap-2">
          {undoStack.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndoLast}
              title="Undo last accepted suggestion"
            >
              <Undo2 className="h-4 w-4" />
              Undo
              <span className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-muted px-1 text-[10px] font-bold">
                {undoStack.length}
              </span>
            </Button>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload resume
              </span>
            </Button>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              handleSaveNewVersion()
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save as new version
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={versions.length === 0}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadTxt}>
                <FileText className="h-4 w-4" />
                Plain text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadDocx}>
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPdf}>
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Group orientation="horizontal" className="flex-1 min-h-0">
        <Panel defaultSize={50} minSize={20}>
          <Group orientation="vertical">
            <Panel defaultSize={75} minSize={20}>
              <div className="flex h-full flex-col rounded-md border border-border bg-background shadow-sm m-1">
                <div className="border-b bg-muted px-3 py-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-foreground">Resume</Label>
                </div>
                <div className="flex flex-1 flex-col p-2 min-h-0">
                {versions.length === 0 ? (
                  <div className="mt-1 flex flex-1 flex-col items-center justify-center rounded border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    <Upload className="h-10 w-10 mb-2 opacity-50" />
                    <p>Upload a PDF or Word resume to get started.</p>
                    <p className="mt-1 text-xs">We'll extract the text and score it against the job posting.</p>
                  </div>
                ) : (
                  <Textarea
                    ref={resumeTextareaRef}
                    className="mt-1 flex-1 min-h-0 resize-none font-mono text-sm"
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="Edit resume content..."
                  />
                )}
                </div>
              </div>
            </Panel>
            <Separator className="h-2 w-full bg-border data-[resize-handle-active]:bg-primary/20" />
            <Panel defaultSize={25} minSize={10}>
              <div className="flex h-full flex-col rounded-md border border-border bg-background shadow-sm m-1">
                <div className="border-b bg-muted px-3 py-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-foreground">Job Posting</Label>
                </div>
                <div className="flex flex-1 flex-col p-2 min-h-0">
                {activeKeywords.length > 0 ? (
                  <HighlightedJobPosting
                    text={project.jobPostingText || "No job posting text."}
                    keywords={activeKeywords}
                  />
                ) : (
                  <div className="mt-1 flex-1 overflow-auto rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {project.jobPostingText || "No job posting text."}
                  </div>
                )}
                </div>
              </div>
            </Panel>
          </Group>
        </Panel>
        <Separator className="w-2 bg-border data-[resize-handle-active]:bg-primary/20" />
        <Panel defaultSize={50} minSize={20}>
          <div className="flex h-full flex-col rounded-md border border-border bg-background shadow-sm m-1">
            <div className="flex items-center justify-between border-b bg-muted px-3 py-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-foreground">
                Suggestions
                {suggestions.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {suggestions.length}
                  </span>
                )}
              </Label>
              <div className="flex gap-1">
                {suggestions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAcceptAll}
                    title="Accept all suggestions"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Accept all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateSuggestions}
                  disabled={suggestionsLoading || !selectedVersionId}
                >
                  {suggestionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>
            <ul className="flex-1 overflow-auto space-y-2 p-2">
              {suggestions.length === 0 && !suggestionsLoading && (
                <li className="text-muted-foreground text-sm">Generate suggestions to see improvements.</li>
              )}
              {suggestions.map((s) => {
                const isActive = activeSuggestionId === s.id
                return (
                  <li
                    key={s.id}
                    className={`group cursor-pointer rounded border p-2 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setActiveSuggestionId(isActive ? null : s.id)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <SuggestionBadge type={s.type} />
                      <span className="flex-1">{s.text}</span>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-blue-600 hover:bg-blue-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAskAboutSuggestion(s)
                          }}
                          title="Ask about this in chat"
                        >
                          <MessageCircleQuestion className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600 hover:bg-green-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAcceptSuggestion(s)
                          }}
                          title="Accept"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDismissSuggestion(s)
                          }}
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isActive && s.originalText && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="rounded bg-red-500/10 px-2 py-1 line-through decoration-red-400">
                          {s.originalText}
                        </div>
                        <div className="rounded bg-green-500/10 px-2 py-1">
                          {s.suggestedText}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </Panel>
      </Group>

      {chatOpen && (
        <div className="fixed right-6 bottom-6 z-50 flex h-[420px] w-[400px] flex-col rounded-lg border border-blue-400 bg-blue-200 shadow-2xl dark:border-blue-600 dark:bg-blue-900">
          <div className="flex items-center justify-between border-b border-blue-400 bg-blue-600 px-3 py-2 rounded-t-lg dark:border-blue-500 dark:bg-blue-800">
            <span className="text-xs font-bold uppercase tracking-wide text-white">Chat</span>
            <button
              onClick={() => { setChatOpen(false); setChatSuggestionCtx(null); setChatSourceSuggestionId(null) }}
              className="rounded p-0.5 text-white hover:bg-blue-500"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={chatScrollRef} className="flex-1 overflow-auto space-y-2 p-3 text-sm">
            {chatSessionMessages.map((m, i) => {
              const change = m.role === "assistant" ? parseChatChange(m.content) : null
              const displayText = m.role === "assistant" ? stripSuggestionBlock(m.content) : m.content
              return (
                <div key={i} className={m.role === "user" ? "text-right" : ""}>
                  <span className="font-medium">{m.role === "user" ? "You" : "Assistant"}: </span>
                  <span className="whitespace-pre-wrap">{displayText}</span>
                  {change && (
                    <div className="mt-2 rounded border border-green-400 bg-green-500/5 p-2 text-left text-xs">
                      <div className="mb-1 font-semibold text-green-700 dark:text-green-400">Proposed change:</div>
                      <div className="rounded bg-red-500/10 px-2 py-1 line-through decoration-red-400">{change.originalText}</div>
                      <div className="mt-1 rounded bg-green-500/10 px-2 py-1">{change.suggestedText}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleApplyChatChange(change)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Apply this change
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 border-t border-blue-300 p-3 dark:border-blue-700">
            <Input
              ref={chatInputRef}
              placeholder="Ask about your resume..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
            />
            <Button
              size="icon"
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
            >
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
