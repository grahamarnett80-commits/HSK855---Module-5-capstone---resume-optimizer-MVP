import { config } from "dotenv"
import { NextResponse } from "next/server"
import path from "path"

// Same load as in actions/stripe.ts so we can verify .env.local is read
config({ path: path.resolve(process.cwd(), ".env.local") })

/** GET /api/debug-stripe-env — returns whether pack env vars are set (no values). Disabled in production. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 })
  }
  const packVarsSet = {
    "3": !!process.env.STRIPE_PRICE_ID_3_PACK?.trim(),
    "10": !!process.env.STRIPE_PRICE_ID_10_PACK?.trim(),
    "25": !!process.env.STRIPE_PRICE_ID_25_PACK?.trim()
  }
  return NextResponse.json({
    ok: packVarsSet["3"] && packVarsSet["10"] && packVarsSet["25"],
    packVarsSet,
    cwd: process.cwd()
  })
}
