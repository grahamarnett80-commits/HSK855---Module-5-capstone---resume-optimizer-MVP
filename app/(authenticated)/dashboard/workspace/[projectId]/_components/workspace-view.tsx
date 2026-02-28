"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Group, Panel, Separator } from "react-resizable-panels"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  uploadResume,
  type UploadResult
} from "@/actions/resume-upload"
import { scoreResumeVersion } from "@/actions/resume-score"
import { getSuggestionsForVersion, generateSuggestionsForVersion, type SuggestionItem } from "@/actions/suggestions"
import { getChatMessages, sendChatMessage } from "@/actions/chat"
import { createNewVersionFromContent } from "@/actions/resume-save-version"
import { getVersionsByProjectId } from "@/actions/resume-versions"
import { Loader2, Send, Upload, Sparkles, Save, Pencil, Eye, Check, X, CheckCheck } from "lucide-react"
import { HighlightedResume } from "./highlighted-resume"
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
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [reviewMode, setReviewMode] = useState(false)
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null)

  const currentVersion = versions.find((v) => v.id === selectedVersionId)

  const activeSuggestion = useMemo(
    () => suggestions.find((s) => s.id === activeSuggestionId) ?? null,
    [suggestions, activeSuggestionId]
  )

  const activeKeywords = useMemo(
    () => activeSuggestion?.jobPostingKeywords ?? [],
    [activeSuggestion]
  )

  const loadSuggestions = useCallback(async () => {
    if (!selectedVersionId) return
    const res = await getSuggestionsForVersion(selectedVersionId)
    if (res.success && res.suggestions) {
      setSuggestions(res.suggestions)
      if (res.suggestions.length > 0) setReviewMode(true)
    }
  }, [selectedVersionId])

  const loadChat = useCallback(async () => {
    const res = await getChatMessages(project.id)
    if (res.success && res.messages) setChatMessages(res.messages)
  }, [project.id])

  useEffect(() => {
    if (selectedVersionId) loadSuggestions()
  }, [selectedVersionId, loadSuggestions])

  useEffect(() => {
    loadChat()
  }, [loadChat])

  useEffect(() => {
    if (currentVersion) setResumeContent(currentVersion.content)
  }, [currentVersion])

  function handleAcceptSuggestion(s: SuggestionItem) {
    if (s.originalText && s.suggestedText && resumeContent.includes(s.originalText)) {
      setResumeContent((prev) => prev.replace(s.originalText, s.suggestedText))
      toast.success("Suggestion applied.")
    } else {
      toast.error("Could not find the original text in your resume. It may have already been modified.")
    }
    const remaining = suggestions.filter((x) => x.id !== s.id)
    setSuggestions(remaining)
    setActiveSuggestionId(null)
    if (remaining.length === 0) setReviewMode(false)
  }

  function handleDismissSuggestion(s: SuggestionItem) {
    const remaining = suggestions.filter((x) => x.id !== s.id)
    setSuggestions(remaining)
    setActiveSuggestionId(null)
    if (remaining.length === 0) setReviewMode(false)
  }

  function handleAcceptAll() {
    let content = resumeContent
    let applied = 0
    for (const s of suggestions) {
      if (s.originalText && s.suggestedText && content.includes(s.originalText)) {
        content = content.replace(s.originalText, s.suggestedText)
        applied++
      }
    }
    setResumeContent(content)
    setSuggestions([])
    setActiveSuggestionId(null)
    setReviewMode(false)
    toast.success(`Applied ${applied} suggestion${applied !== 1 ? "s" : ""}.`)
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
      setSuggestions(res.suggestions)
      if (res.suggestions.length > 0) setReviewMode(true)
    } else {
      toast.error(res.error)
    }
  }

  async function handleSaveNewVersion() {
    if (!resumeContent.trim()) {
      toast.error("Resume content is empty.")
      return
    }
    setSaving(true)
    const res = await createNewVersionFromContent(project.id, resumeContent)
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

  async function handleSendChat() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput("")
    setChatLoading(true)
    const res = await sendChatMessage(project.id, text)
    setChatLoading(false)
    if (res.success && res.reply) {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: res.reply! }
      ])
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
          {versions.length > 0 && (
            <Button
              type="button"
              variant={reviewMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setReviewMode(!reviewMode)
                if (reviewMode) setActiveSuggestionId(null)
              }}
              title={reviewMode ? "Switch to Edit mode" : "Switch to Review mode"}
            >
              {reviewMode ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {reviewMode ? "Edit" : "Review"}
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
            onClick={handleSaveNewVersion}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save as new version
          </Button>
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
                ) : reviewMode && suggestions.length > 0 ? (
                  <HighlightedResume
                    content={resumeContent}
                    suggestions={suggestions}
                    activeSuggestionId={activeSuggestionId}
                    onAccept={handleAcceptSuggestion}
                    onDismiss={handleDismissSuggestion}
                    onClickSuggestionArea={(id) =>
                      setActiveSuggestionId(activeSuggestionId === id ? null : id)
                    }
                  />
                ) : (
                  <Textarea
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
          <Group orientation="vertical">
            <Panel defaultSize={75} minSize={20}>
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
                          if (!reviewMode) setReviewMode(true)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <SuggestionBadge type={s.type} />
                          <span className="flex-1">{s.text}</span>
                          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
            <Separator className="h-2 w-full bg-border data-[resize-handle-active]:bg-primary/20" />
            <Panel defaultSize={25} minSize={10}>
              <div className="flex h-full flex-col rounded-md border border-border bg-background shadow-sm m-1">
                <div className="border-b bg-muted px-3 py-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-foreground">Chat</Label>
                </div>
                <div className="flex flex-1 flex-col p-2 min-h-0">
                  <div className="flex-1 overflow-auto space-y-2 rounded border bg-muted/30 p-2 text-sm">
                    {chatMessages.map((m, i) => (
                      <div
                        key={i}
                        className={m.role === "user" ? "text-right" : ""}
                      >
                        <span className="font-medium">{m.role === "user" ? "You" : "Assistant"}: </span>
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
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
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  )
}
