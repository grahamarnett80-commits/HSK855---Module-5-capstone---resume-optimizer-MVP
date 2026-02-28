"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Group, Panel, Separator } from "react-resizable-panels"
import { useCallback, useEffect, useState } from "react"
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
import { Loader2, Send, Upload, Sparkles, Save } from "lucide-react"

type Version = {
  id: string
  versionNumber: number
  content: string
  score: number | null
  scoredAt: string | null
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

  const currentVersion = versions.find((v) => v.id === selectedVersionId)

  const loadSuggestions = useCallback(async () => {
    if (!selectedVersionId) return
    const res = await getSuggestionsForVersion(selectedVersionId)
    if (res.success && res.suggestions) setSuggestions(res.suggestions)
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
      loadSuggestions()
    } else {
      toast.error(result.error)
    }
  }

  async function handleGenerateSuggestions() {
    if (!selectedVersionId) return
    setSuggestionsLoading(true)
    const res = await generateSuggestionsForVersion(selectedVersionId)
    setSuggestionsLoading(false)
    if (res.success && res.suggestions) setSuggestions(res.suggestions)
    else toast.error(res.error)
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
      toast.success("New version saved and scored.")
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
      }
      loadSuggestions()
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
            <Panel defaultSize={50} minSize={15}>
              <div className="flex h-full flex-col border-r p-2">
                <Label className="text-xs font-medium text-muted-foreground">Job posting</Label>
                <div className="mt-1 flex-1 overflow-auto rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {project.jobPostingText || "No job posting text."}
                </div>
              </div>
            </Panel>
            <Separator className="h-2 w-full bg-border data-[resize-handle-active]:bg-primary/20" />
            <Panel defaultSize={50} minSize={15}>
              <div className="flex h-full flex-col border-r p-2">
                <Label className="text-xs font-medium text-muted-foreground">Resume</Label>
                {versions.length === 0 ? (
                  <div className="mt-1 flex flex-1 flex-col items-center justify-center rounded border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    <Upload className="h-10 w-10 mb-2 opacity-50" />
                    <p>Upload a PDF or Word resume to get started.</p>
                    <p className="mt-1 text-xs">We’ll extract the text and score it against the job posting.</p>
                  </div>
                ) : (
                  <Textarea
                    className="mt-1 flex-1 min-h-0 resize-none font-mono text-sm"
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="Edit resume content..."
                  />
                )}
              </div>
            </Panel>
          </Group>
        </Panel>
        <Separator className="w-2 bg-border data-[resize-handle-active]:bg-primary/20" />
        <Panel defaultSize={50} minSize={20}>
          <Group orientation="vertical">
            <Panel defaultSize={50} minSize={15}>
              <div className="flex h-full flex-col border-r p-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Suggestions</Label>
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
                <ul className="mt-1 flex-1 overflow-auto space-y-2">
                  {suggestions.length === 0 && !suggestionsLoading && (
                    <li className="text-muted-foreground text-sm">Generate suggestions to see improvements.</li>
                  )}
                  {suggestions.map((s) => (
                    <li key={s.id} className="rounded border bg-muted/30 p-2 text-sm">
                      {s.text}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
            <Separator className="h-2 w-full bg-border data-[resize-handle-active]:bg-primary/20" />
            <Panel defaultSize={50} minSize={15}>
              <div className="flex h-full flex-col p-2">
                <Label className="text-xs font-medium text-muted-foreground">Chat</Label>
                <div className="mt-1 flex-1 overflow-auto space-y-2 rounded border bg-muted/30 p-2 text-sm">
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
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  )
}
