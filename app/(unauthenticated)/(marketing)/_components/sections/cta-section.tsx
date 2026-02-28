"use client"

import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { ArrowRight, FolderOpen } from "lucide-react"
import Link from "next/link"
import { SectionWrapper } from "./section-wrapper"

export function CTASection() {
  return (
    <SectionWrapper>
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Ready to optimize your resume?
        </motion.h2>
        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg leading-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Stop guessing if your resume is good enough. Get an AI-powered
          match score and targeted suggestions in minutes.
        </motion.p>
        <motion.div
          className="mt-10 flex items-center justify-center gap-x-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SignedOut>
            <Button
              size="lg"
              className="bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-hover"
              asChild
            >
              <Link href="/signup">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              size="lg"
              className="bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-hover"
              asChild
            >
              <Link href="/dashboard">
                <FolderOpen className="mr-2 h-4 w-4" />
                Go to my projects
              </Link>
            </Button>
          </SignedIn>
          <Button
            size="lg"
            variant="link"
            className="text-brand-primary hover:text-brand-primary-hover"
            asChild
          >
            <Link href="#features">
              Learn more <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-3 gap-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {[
            { label: "Time to First Score", value: "< 2 min" },
            { label: "Canadian Standards", value: "100%" },
            { label: "AI Accuracy", value: "Truthful" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <dt className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </dt>
              <dd className="from-brand-primary to-brand-secondary mt-2 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                {stat.value}
              </dd>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
