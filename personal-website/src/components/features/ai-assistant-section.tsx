'use client'

import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { EmbeddedChat } from '@/components/features/embedded-chat'

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
          className="space-y-6"
        >
          <div className="text-center space-y-6">
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
          </div>

          {/* Embedded Chat */}
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
            <EmbeddedChat />
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

          <motion.p variants={itemVariants} className="text-xs text-muted-foreground text-center">
            Requires a WebGPU-compatible browser (Chromium, Edge)
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
