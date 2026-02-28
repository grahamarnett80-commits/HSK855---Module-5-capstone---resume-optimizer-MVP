"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useState } from "react"
import { SectionWrapper } from "./section-wrapper"

const faqs = [
  {
    question: "How does the match scoring work?",
    answer:
      "Our AI analyzes your resume against the job posting and produces a percentage score based on keyword alignment, skills match, experience relevance, and formatting. It highlights specific areas where your resume can be strengthened."
  },
  {
    question: "Will the AI make up information about me?",
    answer:
      "Never. Our AI is built to be truthful and factual. It will only suggest edits based on the information you provide. If it needs more details about your experience, it will ask clarifying questions through the chat assistant rather than fabricating content."
  },
  {
    question: "What resume formats are supported?",
    answer:
      "You can upload your resume as a PDF (.pdf) or Word document (.docx). The text is extracted automatically so you can review, edit, and optimize it directly in the workspace."
  },
  {
    question: "Is this optimized for Canadian resumes?",
    answer:
      "Yes. All suggestions follow Canadian resume best practices: 1-2 pages maximum, no photos or personal information (age, marital status), action verbs, quantified achievements, ATS-friendly formatting, and Canadian spelling conventions."
  },
  {
    question: "Can I track my progress across revisions?",
    answer:
      "Absolutely. Every time you save a new version, the AI re-scores it against the job posting. You can switch between versions to compare scores and see how your resume has improved over time."
  },
  {
    question: "Is my data secure?",
    answer:
      "Your resume data is stored securely using Supabase with row-level security. Only you can access your projects, resume versions, and chat history. We never share your personal information."
  }
]

export function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (question: string) => {
    setOpenItems(prev =>
      prev.includes(question)
        ? prev.filter(item => item !== question)
        : [...prev, question]
    )
  }

  return (
    <SectionWrapper id="faq">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="text-foreground text-2xl leading-10 font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            className="text-muted-foreground mt-6 text-base leading-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Everything you need to know about OnTarget Resume Studio.
          </motion.p>
          <dl className="mt-10 space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Collapsible
                  open={openItems.includes(faq.question)}
                  onOpenChange={() => toggleItem(faq.question)}
                >
                  <CollapsibleTrigger className="flex w-full items-start justify-between text-left">
                    <span className="text-foreground text-base leading-7 font-semibold">
                      {faq.question}
                    </span>
                    <motion.span
                      className="ml-6 flex h-7 items-center"
                      animate={{
                        rotate: openItems.includes(faq.question) ? 45 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus
                        className="text-muted-foreground h-6 w-6"
                        aria-hidden="true"
                      />
                    </motion.span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pr-12">
                    <motion.p
                      className="text-muted-foreground text-base leading-7"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {faq.answer}
                    </motion.p>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </SectionWrapper>
  )
}
