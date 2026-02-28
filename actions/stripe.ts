"use server"

import { config } from "dotenv"
import path from "path"
import {
  createCustomer,
  getCustomerByUserId,
  updateCustomerByStripeCustomerId,
  updateCustomerByUserId
} from "@/actions/customers"
import { SelectCustomer } from "@/db/schema/customers"
import { stripe } from "@/lib/stripe"
import { auth } from "@clerk/nextjs/server"
import Stripe from "stripe"

// Load .env.local from project root so pack price IDs are available (Next/Turbopack may not expose them to server actions).
config({ path: path.resolve(process.cwd(), ".env.local") })

type MembershipStatus = SelectCustomer["membership"]

const getMembershipStatus = (
  status: Stripe.Subscription.Status,
  membership: MembershipStatus
): MembershipStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return membership
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "unpaid":
      return "free"
    default:
      return "free"
  }
}

const getSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  })
}

export const updateStripeCustomer = async (
  userId: string,
  subscriptionId: string,
  customerId: string
) => {
  try {
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer")
    }

    const subscription = await getSubscription(subscriptionId)

    // Check if customer exists
    const existingCustomer = await getCustomerByUserId(userId)
    
    let result
    if (!existingCustomer) {
      // Create customer first
      const createResult = await createCustomer(userId)
      if (!createResult.isSuccess) {
        throw new Error("Failed to create customer profile")
      }
      
      // Then update with Stripe data
      result = await updateCustomerByUserId(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      })
    } else {
      // Customer exists, just update
      result = await updateCustomerByUserId(userId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      })
    }

    if (!result.isSuccess) {
      throw new Error("Failed to update customer profile")
    }

    return result.data
  } catch (error) {
    console.error("Error in updateStripeCustomer:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update Stripe customer")
  }
}

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  productId: string
): Promise<MembershipStatus> => {
  try {
    if (!subscriptionId || !customerId || !productId) {
      throw new Error(
        "Missing required parameters for manageSubscriptionStatusChange"
      )
    }

    const subscription = await getSubscription(subscriptionId)
    const product = await stripe.products.retrieve(productId)

    const membership = product.metadata?.membership

    if (!membership || !["free", "pro"].includes(membership)) {
      throw new Error(
        `Invalid or missing membership type in product metadata: ${membership}`
      )
    }

    const validatedMembership = membership as MembershipStatus

    const membershipStatus = getMembershipStatus(
      subscription.status,
      validatedMembership
    )

    const updateResult = await updateCustomerByStripeCustomerId(customerId, {
      stripeSubscriptionId: subscription.id,
      membership: membershipStatus
    })

    if (!updateResult.isSuccess) {
      throw new Error("Failed to update subscription status")
    }

    return membershipStatus
  } catch (error) {
    console.error("Error in manageSubscriptionStatusChange:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to update subscription status")
  }
}

export const createCheckoutUrl = async (
  paymentLinkUrl: string
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { url: null, error: "User must be authenticated" }
    }

    if (!paymentLinkUrl) {
      return { url: null, error: "Payment link URL is required" }
    }

    // Add client_reference_id to the Stripe payment link
    const url = new URL(paymentLinkUrl)
    url.searchParams.set("client_reference_id", userId)

    return { url: url.toString(), error: null }
  } catch (error) {
    console.error("Error creating checkout URL:", error)
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "Failed to create checkout URL"
    }
  }
}

function getPackPriceId(packSize: 3 | 10 | 25): string {
  const raw =
    packSize === 3
      ? process.env.STRIPE_PRICE_ID_3_PACK
      : packSize === 10
        ? process.env.STRIPE_PRICE_ID_10_PACK
        : process.env.STRIPE_PRICE_ID_25_PACK
  return (raw ?? "").trim()
}

export async function createPackCheckoutUrl(
  packSize: 3 | 10 | 25
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { userId } = await auth()
    if (!userId) return { url: null, error: "Not authenticated" }

    const priceId = getPackPriceId(packSize)
    if (!priceId)
      return {
        url: null,
        error: `Pack not configured. Add STRIPE_PRICE_ID_${packSize}_PACK to .env.local with a one-time Price ID from the Stripe Dashboard (Products → your pack → Price).`
      }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId,
      metadata: { pack_size: String(packSize) },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?pack=success`,
      cancel_url: `${baseUrl}/dashboard#pricing`
    })

    return { url: session.url, error: null }
  } catch (error) {
    console.error("createPackCheckoutUrl:", error)
    return {
      url: null,
      error: error instanceof Error ? error.message : "Failed to start checkout"
    }
  }
}
