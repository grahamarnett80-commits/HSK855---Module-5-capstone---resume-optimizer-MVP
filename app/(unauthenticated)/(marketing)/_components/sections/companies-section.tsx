"use client"

import { motion } from "framer-motion"
import { SectionWrapper } from "./section-wrapper"

const steps = [
  {
    number: "1",
    title: "Create a project",
    description: "Paste a job posting URL or the full description to get started."
  },
  {
    number: "2",
    title: "Upload your resume",
    description: "Upload a PDF or Word document. We extract the text automatically."
  },
  {
    number: "3",
    title: "Get your match score",
    description:
      "AI analyzes your resume against the job posting and gives you a percentage score."
  },
  {
    number: "4",
    title: "Optimize & iterate",
    description:
      "Review suggestions, chat with the AI, edit your resume, and watch your score improve."
  }
]

export function CompaniesSection() {
  return (
    <SectionWrapper>
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            Four simple steps to a better resume
          </p>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {step.number}
              </motion.div>
              <h3 className="text-foreground mt-4 text-base font-semibold">
                {step.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
