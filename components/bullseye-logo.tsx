"use client"

import { cn } from "@/lib/utils"

/** Stylized 3-ring bullseye: inner = Resume, middle = Job posting, outer = Suggestions. */
export function BullseyeLogo({ className, size = 32 }: { className?: string; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  // Three rings: radii ~25%, 50%, 75% of half-size for even spacing
  const r1 = size * 0.2
  const r2 = size * 0.35
  const r3 = size * 0.48
  const stroke = Math.max(1, size / 20)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 text-foreground", className)}
      aria-hidden="true"
      role="img"
    >
      <title>OnTarget Resume Studio — Resume, Job posting, Suggestions</title>
      {/* Inner ring: Resume */}
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke="currentColor" strokeWidth={stroke} />
      {/* Middle ring: Job posting */}
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke="currentColor" strokeWidth={stroke} />
      {/* Outer ring: Suggestions */}
      <circle cx={cx} cy={cy} r={r3} fill="none" stroke="currentColor" strokeWidth={stroke} />
    </svg>
  )
}
