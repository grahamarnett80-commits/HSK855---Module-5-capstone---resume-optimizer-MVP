"use client"

import { Fragment, useMemo } from "react"

interface HighlightedJobPostingProps {
  text: string
  keywords: string[]
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function HighlightedJobPosting({ text, keywords }: HighlightedJobPostingProps) {
  const segments = useMemo(() => {
    const validKeywords = keywords.filter((k) => k.trim().length > 0)
    if (validKeywords.length === 0) {
      return [{ text, highlight: false }]
    }

    const sorted = [...validKeywords].sort((a, b) => b.length - a.length)
    const pattern = new RegExp(`(${sorted.map(escapeRegex).join("|")})`, "gi")
    const parts = text.split(pattern)

    const lowerKeywords = new Set(validKeywords.map((k) => k.toLowerCase()))

    return parts.map((part) => ({
      text: part,
      highlight: lowerKeywords.has(part.toLowerCase())
    }))
  }, [text, keywords])

  return (
    <div className="mt-1 flex-1 overflow-auto rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="rounded bg-yellow-300/40 px-0.5 text-foreground dark:bg-yellow-500/30"
          >
            {seg.text}
          </mark>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        )
      )}
    </div>
  )
}
