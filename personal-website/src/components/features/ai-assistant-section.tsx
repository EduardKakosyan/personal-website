'use client'

import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Sparkles } from 'lucide-react'
import { motion, useInView } from 'motion/react'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function AIAssistantSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section
      className="py-20 md:py-32 w-full section-dark relative overflow-hidden"
      data-section="ai-assistant"
      data-ai-assistant
    >
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[var(--accent-neon)]/5 blur-[100px]" />

      <div className="relative container mx-auto px-4 max-w-4xl" ref={ref}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="text-center space-y-6"
        >
          <motion.div variants={itemVariants}>
            <span className="text-sm font-mono text-[var(--accent-neon)] tracking-widest uppercase">
              Interactive Demo
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3">
            <Sparkles className="h-6 w-6 text-[var(--accent-neon)]" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              AI Assistant
            </h2>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Have questions about my projects or background? Chat with my local browser-hosted AI
            assistant — no data leaves your device.
          </motion.p>

          {/* Mock chat preview */}
          <motion.div
            variants={itemVariants}
            className="max-w-md mx-auto rounded-xl glass-card p-4 space-y-3"
          >
            <div className="flex gap-2 items-start">
              <div className="h-6 w-6 rounded-full bg-[var(--accent-neon)]/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-3 w-3 text-[var(--accent-neon)]" />
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2 text-sm text-left">
                Hey! Ask me anything about Eduard&apos;s projects or background.
              </div>
            </div>
            <div className="flex gap-2 items-start justify-end">
              <div className="bg-primary/20 rounded-lg px-3 py-2 text-sm text-right">
                What did you build at the hackathon?
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="h-6 w-6 rounded-full bg-[var(--accent-neon)]/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-3 w-3 text-[var(--accent-neon)]" />
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2 text-sm text-left flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-neon)] animate-pulse" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-neon)] animate-pulse [animation-delay:0.2s]" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-neon)] animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto"
          >
            {[
              'Powered by WebLLM',
              'Runs Locally in Browser',
              'No Data Sent to Servers',
              'Llama-3.2-1B',
            ].map((label) => (
              <motion.div key={label} variants={itemVariants}>
                <Badge
                  variant="outline"
                  className="text-xs border-[var(--accent-neon)]/30 text-muted-foreground"
                >
                  {label}
                </Badge>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              size="lg"
              className="mt-4 bg-[var(--accent-neon)] text-black hover:bg-[var(--accent-neon)]/90 font-semibold px-8"
              onClick={() => {
                // Click the floating chatbot button
                const chatBtn = document.querySelector(
                  '[aria-label="Open chat"]',
                ) as HTMLButtonElement
                chatBtn?.click()
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Try It Now
            </Button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-xs text-muted-foreground">
            Requires a WebGPU-compatible browser (Chromium, Edge)
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
