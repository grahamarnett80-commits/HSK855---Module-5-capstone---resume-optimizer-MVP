"use client"

import { useEffect, useRef, useMemo, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, MessageCircleQuestion } from "lucide-react"
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
  onAskAboutBracket?: (bracketText: string) => void
}

type SegmentKind = "plain" | "suggestion" | "bracket"

interface TextSegment {
  text: string
  kind: SegmentKind
  suggestion: SuggestionItem | null
}

function buildSegments(
  content: string,
  suggestions: SuggestionItem[]
): TextSegment[] {
  const matchable = suggestions.filter(
    (s) => s.originalText && content.includes(s.originalText)
  )

  type Region = { start: number; end: number; kind: SegmentKind; suggestion: SuggestionItem | null }
  const regions: Region[] = []

  for (const s of matchable) {
    const idx = content.indexOf(s.originalText)
    if (idx !== -1) {
      regions.push({ start: idx, end: idx + s.originalText.length, kind: "suggestion", suggestion: s })
    }
  }

  const bracketRe = /\[[^\]]+\]/g
  let match: RegExpExecArray | null
  while ((match = bracketRe.exec(content)) !== null) {
    regions.push({ start: match.index, end: match.index + match[0].length, kind: "bracket", suggestion: null })
  }

  regions.sort((a, b) => a.start - b.start)

  const deduped: Region[] = []
  for (const r of regions) {
    const last = deduped[deduped.length - 1]
    if (!last || r.start >= last.end) {
      deduped.push(r)
    }
  }

  const segments: TextSegment[] = []
  let cursor = 0
  for (const r of deduped) {
    if (r.start > cursor) {
      segments.push({ text: content.slice(cursor, r.start), kind: "plain", suggestion: null })
    }
    segments.push({ text: content.slice(r.start, r.end), kind: r.kind, suggestion: r.suggestion })
    cursor = r.end
  }
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), kind: "plain", suggestion: null })
  }

  return segments
}

export const hasBracketPlaceholders = (text: string) => /\[[^\]]+\]/.test(text)

export function HighlightedResume({
  content,
  suggestions,
  activeSuggestionId,
  onAccept,
  onDismiss,
  onClickSuggestionArea,
  onAskAboutBracket
}: HighlightedResumeProps) {
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeSuggestionId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [activeSuggestionId])

  const segments = useMemo(
    () => buildSegments(content, suggestions),
    [content, suggestions]
  )

  return (
    <div className="mt-1 flex-1 overflow-auto rounded border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.kind === "bracket") {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 rounded border border-orange-400 bg-orange-400/20 px-0.5 font-semibold text-orange-700 animate-pulse dark:border-amber-400 dark:bg-amber-500/35 dark:text-amber-200"
              title="Placeholder — update this with your information"
            >
              {seg.text}
              {onAskAboutBracket && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAskAboutBracket(seg.text) }}
                  className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-700 hover:bg-orange-500/40 dark:bg-amber-500/40 dark:text-amber-200 dark:hover:bg-amber-500/60"
                  title="Ask AI for help filling this in"
                >
                  <MessageCircleQuestion className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          )
        }

        if (seg.kind === "plain" || !seg.suggestion) {
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
