'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, useInView } from 'motion/react'
import { TextReveal } from '@/components/ui/text-reveal'

interface ExpertiseArea {
  title: string
  description: string
  technologies: string[]
  applications: string[]
}

const expertiseAreas: ExpertiseArea[] = [
  {
    title: 'Agents & LLMs',
    description:
      'Building tool-calling agents for document processing, RFP sorting, and knowledge-base Q&A across 20+ client deployments',
    technologies: [
      'Claude Code',
      'Anthropic Claude',
      'LangChain',
      'CrewAI',
      'n8n',
      'Google AI Studio',
    ],
    applications: [
      'Client Agents',
      'Document Processing',
      'Autonomous Workflows',
      'Multi-Agent Systems',
    ],
  },
  {
    title: 'Voice & Local AI',
    description:
      'Running voice pipelines and LLMs entirely on-device with sub-800ms latency — no cloud dependency',
    technologies: [
      'Ollama',
      'llama.cpp',
      'MLX',
      'Silero VAD',
      'Kokoro TTS',
      'WebLLM',
      'ONNX Runtime',
    ],
    applications: ['Voice Agents', 'On-Device Inference', 'Speech-to-Text', 'Overlapped Streaming'],
  },
  {
    title: 'Full-Stack & Infra',
    description:
      'TypeScript and Go for dashboards, APIs, and developer tooling — from Supabase schemas to Docker orchestration',
    technologies: [
      'Next.js',
      'Go',
      'TypeScript',
      'Supabase',
      'Docker',
      'Python',
      'FastAPI',
      'Azure',
    ],
    applications: ['Business Dashboards', 'API Integrations', 'Developer Tools', 'CI/CD Pipelines'],
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function AIExpertiseSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.15 })

  return (
    <section className="py-16 md:py-28 w-full section-dark" data-section="expertise">
      <div className="container mx-auto px-4 max-w-6xl" ref={ref}>
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="text-sm font-mono text-[var(--accent-neon)] tracking-widest uppercase">
              What I Do
            </span>
          </motion.div>
          <TextReveal
            text="Technical Expertise"
            as="h2"
            className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl justify-center"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-muted-foreground md:text-lg max-w-3xl mx-auto mt-4"
          >
            From client-facing agents to offline voice pipelines — here&apos;s what I work with day
            to day
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {expertiseAreas.map((area, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
            >
              <Card className="h-full border-0 shadow-lg glass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-[var(--accent-neon)]/30 font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <CardTitle className="text-xl">{area.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {area.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                      Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {area.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                      Applications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {area.applications.map((app, appIndex) => (
                        <Badge key={appIndex} variant="outline" className="text-xs">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
