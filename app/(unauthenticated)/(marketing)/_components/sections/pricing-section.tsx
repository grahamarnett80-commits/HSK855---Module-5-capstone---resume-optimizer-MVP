"use client"

import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Check, Rocket } from "lucide-react"
import Link from "next/link"
import { SectionWrapper } from "./section-wrapper"

const features = [
  "Unlimited projects",
  "Resume upload (PDF & Word)",
  "AI match scoring",
  "Smart revision suggestions",
  "AI chat assistant",
  "Full version history",
  "Canadian resume standards"
]

export function PricingSection() {
  return (
    <SectionWrapper id="pricing">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Free during beta
          </motion.h2>
          <motion.p
            className="text-muted-foreground mt-4 text-lg leading-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Get full access to every feature while we&apos;re in beta. No
            credit card required.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 max-w-lg">
          <motion.div
            className="bg-card text-card-foreground ring-border relative rounded-3xl p-8 ring-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <Rocket className="text-primary h-8 w-8" />
              <h3 className="text-foreground text-lg leading-8 font-semibold">
                Beta Access
              </h3>
            </div>

            <p className="text-muted-foreground mt-4 text-sm leading-6">
              Everything you need to optimize your resume for any Canadian
              job posting.
            </p>

            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-foreground text-4xl font-bold tracking-tight">
                $0
              </span>
              <span className="text-muted-foreground text-sm leading-6 font-semibold">
                /forever during beta
              </span>
            </p>

            <ul className="text-muted-foreground mt-8 space-y-3 text-sm leading-6">
              {features.map(feature => (
                <li key={feature} className="flex gap-x-3">
                  <Check
                    className="text-primary h-6 w-5 flex-none"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <SignedOut>
              <Button className="mt-8 w-full" size="lg" asChild>
                <Link href="/signup">Get started free</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button className="mt-8 w-full" size="lg" asChild>
                <Link href="/dashboard">Go to my projects</Link>
              </Button>
            </SignedIn>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  )
}
