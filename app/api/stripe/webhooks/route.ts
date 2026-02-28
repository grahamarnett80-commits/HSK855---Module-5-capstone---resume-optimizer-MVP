import {
  manageSubscriptionStatusChange,
  updateStripeCustomer
} from "@/actions/stripe"
import { grantCredits } from "@/lib/entitlements"
import { db } from "@/db"
import { packPurchases } from "@/db/schema/pack-purchases"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"
import Stripe from "stripe"

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
])

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get("Stripe-Signature") as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event: Stripe.Event

  try {
    if (!sig || !webhookSecret) {
      throw new Error("Webhook secret or signature missing")
    }

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
    )
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    )
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionChange(event)
          break

        case "checkout.session.completed":
          await handleCheckoutSession(event)
          await handleCheckoutSessionPayment(event)
          break

        default:
          throw new Error("Unhandled relevant event!")
      }
    } catch (error) {
      console.error("Webhook handler failed:", error)
      return new Response(
        JSON.stringify({
          error: "Webhook handler failed. View your function logs."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  }

  return new Response(JSON.stringify({ received: true }))
}

async function handleSubscriptionChange(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const productId = subscription.items.data[0].price.product as string
  await manageSubscriptionStatusChange(
    subscription.id,
    subscription.customer as string,
    productId
  )
}

async function handleCheckoutSessionPayment(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  if (session.mode !== "payment") return
  const userId = session.client_reference_id
  const packSize = session.metadata?.pack_size
  if (!userId || !packSize) return
  const size = parseInt(packSize, 10)
  if (![3, 10, 25].includes(size)) return
  await grantCredits(userId, size)
  await db.insert(packPurchases).values({
    userId,
    packSize: size,
    stripeSessionId: session.id
  })
}

async function handleCheckoutSession(event: Stripe.Event) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session
  if (checkoutSession.mode === "subscription") {
    const subscriptionId = checkoutSession.subscription as string
    const clientReferenceId = checkoutSession.client_reference_id
    const customerId = checkoutSession.customer as string

    if (!clientReferenceId) {
      throw new Error(
        "client_reference_id is required for subscription checkout"
      )
    }

    await updateStripeCustomer(clientReferenceId, subscriptionId, customerId)

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"]
    })

    const productId = subscription.items.data[0].price.product as string
    await manageSubscriptionStatusChange(
      subscription.id,
      subscription.customer as string,
      productId
    )
  }
}
