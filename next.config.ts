import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  // Expose pack price IDs so they are available in server actions (avoids Turbopack env issues).
  env: {
    STRIPE_PRICE_ID_3_PACK: process.env.STRIPE_PRICE_ID_3_PACK,
    STRIPE_PRICE_ID_10_PACK: process.env.STRIPE_PRICE_ID_10_PACK,
    STRIPE_PRICE_ID_25_PACK: process.env.STRIPE_PRICE_ID_25_PACK
  }
}

export default nextConfig
