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
    title: 'Large Language Models',
    description: 'Building conversational systems and content generation platforms',
    technologies: [
      'Vercel Agents SDK',
      'Anthropic Claude',
      'LangChain',
      'Google AI Studio',
      'CrewAI',
      'n8n',
    ],
    applications: ['Content Generation', 'Code Assistance', 'Document Analysis', 'Agentic Systems'],
  },
  {
    title: 'Local AI Deployment',
    description: 'Hosting and optimizing AI models for privacy-focused and offline applications',
    technologies: [
      'Ollama',
      'llama.cpp',
      'MLX',
      'Whisper',
      'HuggingFace',
      'Raspberry Pi',
      'WebLLM',
      'MLC-AI',
    ],
    applications: [
      'Privacy-First Solutions',
      'Edge Computing',
      'Rapid Prototyping',
      'Custom Fine-tuning',
    ],
  },
  {
    title: 'Tech Stack',
    description: 'Designing scalable, production-ready AI systems with modern frameworks',
    technologies: [
      'Next.js',
      'Python',
      'Typescript',
      'Azure',
      'Docker',
      'FastAPI',
      'N8N',
      'Power Automate',
    ],
    applications: [
      'Enterprise Solutions',
      'Real-time Systems',
      'API Development',
      'Cloud Deployment',
    ],
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
            Experimenting with AI technologies, from local model agents to enterprise-scale systems
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
