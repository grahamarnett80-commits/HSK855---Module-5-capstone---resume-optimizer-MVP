"use client"

import { useEffect, useRef, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import type { SuggestionItem } from "@/actions/suggestions"

const TYPE_COLORS: Record<string, string> = {
  section_rewrite: "bg-blue-500/15 border-blue-400",
  keyword_add: "bg-green-500/15 border-green-400",
  quantify: "bg-purple-500/15 border-purple-400",
  clarify: "bg-amber-500/15 border-amber-400",
  other: "bg-gray-500/15 border-gray-400"
}

function getHighlightColor(type: string | null) {
  return TYPE_COLORS[type ?? "other"] ?? TYPE_COLORS.other
}

interface HighlightedResumeProps {
  content: string
  suggestions: SuggestionItem[]
  activeSuggestionId: string | null
  onAccept: (suggestion: SuggestionItem) => void
  onDismiss: (suggestion: SuggestionItem) => void
  onClickSuggestionArea: (id: string) => void
}

interface TextSegment {
  text: string
  suggestion: SuggestionItem | null
}

function buildSegments(
  content: string,
  suggestions: SuggestionItem[]
): TextSegment[] {
  const matchable = suggestions.filter(
    (s) => s.originalText && content.includes(s.originalText)
  )

  if (matchable.length === 0) {
    return [{ text: content, suggestion: null }]
  }

  type Match = { start: number; end: number; suggestion: SuggestionItem }
  const matches: Match[] = []
  for (const s of matchable) {
    const idx = content.indexOf(s.originalText)
    if (idx !== -1) {
      matches.push({ start: idx, end: idx + s.originalText.length, suggestion: s })
    }
  }
  matches.sort((a, b) => a.start - b.start)

  const deduped: Match[] = []
  for (const m of matches) {
    const last = deduped[deduped.length - 1]
    if (!last || m.start >= last.end) {
      deduped.push(m)
    }
  }

  const segments: TextSegment[] = []
  let cursor = 0
  for (const m of deduped) {
    if (m.start > cursor) {
      segments.push({ text: content.slice(cursor, m.start), suggestion: null })
    }
    segments.push({
      text: content.slice(m.start, m.end),
      suggestion: m.suggestion
    })
    cursor = m.end
  }
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), suggestion: null })
  }

  return segments
}

export function HighlightedResume({
  content,
  suggestions,
  activeSuggestionId,
  onAccept,
  onDismiss,
  onClickSuggestionArea
}: HighlightedResumeProps) {
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeSuggestionId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [activeSuggestionId])

  const segments = buildSegments(content, suggestions)

  return (
    <div className="mt-1 flex-1 overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap leading-relaxed">
      {segments.map((seg, i) => {
        if (!seg.suggestion) {
          return <Fragment key={i}>{seg.text}</Fragment>
        }

        const s = seg.suggestion
        const isActive = activeSuggestionId === s.id
        const colors = getHighlightColor(s.type)

        return (
          <span key={i} className="relative">
            {isActive && (
              <div
                ref={activeRef}
                className="mb-1 rounded border border-green-400 bg-green-500/10 p-2 text-xs"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    Suggested change:
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 hover:bg-green-500/20"
                      onClick={(e) => { e.stopPropagation(); onAccept(s) }}
                      title="Accept suggestion"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:bg-red-500/20"
                      onClick={(e) => { e.stopPropagation(); onDismiss(s) }}
                      title="Dismiss suggestion"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="rounded bg-red-500/10 px-2 py-1 line-through decoration-red-400">
                  {s.originalText}
                </div>
                <div className="mt-1 rounded bg-green-500/10 px-2 py-1">
                  {s.suggestedText}
                </div>
              </div>
            )}
            <span
              className={`cursor-pointer rounded border px-0.5 transition-colors ${colors} ${
                isActive ? "ring-2 ring-primary/40" : "hover:brightness-90"
              }`}
              onClick={() => onClickSuggestionArea(s.id)}
              role="button"
              tabIndex={0}
            >
              {seg.text}
            </span>
          </span>
        )
      })}
    </div>
  )
}
