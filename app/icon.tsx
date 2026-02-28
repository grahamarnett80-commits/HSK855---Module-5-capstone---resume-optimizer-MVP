import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  const cx = 16
  const cy = 16
  const r1 = 32 * 0.2
  const r2 = 32 * 0.35
  const r3 = 32 * 0.48
  const stroke = Math.max(1, 32 / 20)

  return new ImageResponse(
    (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx={cx} cy={cy} r={r1} stroke="#18181b" strokeWidth={stroke} fill="none" />
        <circle cx={cx} cy={cy} r={r2} stroke="#18181b" strokeWidth={stroke} fill="none" />
        <circle cx={cx} cy={cy} r={r3} stroke="#18181b" strokeWidth={stroke} fill="none" />
      </svg>
    ),
    { ...size }
  )
}
