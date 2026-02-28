import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  const sizeNum = 180
  const cx = sizeNum / 2
  const cy = sizeNum / 2
  const r1 = sizeNum * 0.2
  const r2 = sizeNum * 0.35
  const r3 = sizeNum * 0.48
  const stroke = Math.max(1, sizeNum / 20)

  return new ImageResponse(
    (
      <svg
        width={sizeNum}
        height={sizeNum}
        viewBox={`0 0 ${sizeNum} ${sizeNum}`}
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
