'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Building, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { analyticsEvents } from '@/lib/analytics'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

interface Achievement {
  title: string
  position: string
  organization: string
  date: string
  description: string
  color: 'destructive' | 'secondary' | 'default' | 'outline'
  icon: React.ComponentType<{ className?: string }>
  link?: string
  isInternal?: boolean
}

const achievements: Achievement[] = [
  {
    title: 'Atlantic AI Summit 2025',
    position: 'First Place',
    organization: 'Atlantic Canada Universities',
    date: 'May 2025',
    description:
      'Developed llm-powered personas to simulate change in human behavior to real/fake Covid-19 news.',
    color: 'destructive',
    icon: Trophy,
    link: '/projects/healthbyte',
    isInternal: true,
  },
  {
    title: 'AI Developer',
    position: 'Professional Role',
    organization: 'AI-First Consulting',
    date: 'Current',
    description:
      'Building AI solutions for SMBs all across Atlantic Canada, specializing in intelligent automation and LLM integration.',
    color: 'default',
    icon: Building,
    link: 'https://www.ai-first.ca/',
    isInternal: false,
  },
  {
    title: 'Volta Hackathon',
    position: 'Second Place',
    organization: 'Volta Innovation',
    date: 'December 2024',
    description:
      'Developed Second Brain, an AI-powered time management platform for university students.',
    color: 'secondary',
    icon: Trophy,
    link: '/projects/second-brain',
    isInternal: true,
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
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

export function AchievementsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section
      className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 via-secondary/20 to-secondary/10 w-full relative overflow-hidden"
      data-section="achievements"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

      <div className="relative container mx-auto px-4 max-w-6xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border text-sm text-primary font-medium">
            <Trophy className="h-4 w-4" />
            Achievements & Experience
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Recent{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent-neon), oklch(0.70 0.15 260))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Milestones
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Key achievements and professional highlights from my journey in AI development
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid gap-6 md:gap-8 sm:grid-cols-1 lg:grid-cols-3"
        >
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon

            const CardWrapper = achievement.link
              ? achievement.isInternal
                ? ({ children }: { children: React.ReactNode }) => (
                    <Link
                      href={achievement.link!}
                      onClick={() => analyticsEvents.achievementClicked(achievement.title)}
                    >
                      {children}
                    </Link>
                  )
                : ({ children }: { children: React.ReactNode }) => (
                    <div
                      onClick={() => {
                        analyticsEvents.achievementClicked(achievement.title)
                        window.open(achievement.link, '_blank')
                      }}
                    >
                      {children}
                    </div>
                  )
              : ({ children }: { children: React.ReactNode }) => <div>{children}</div>

            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <CardWrapper>
                  <Card
                    className={cn(
                      'h-full group hover:shadow-xl transition-shadow duration-300',
                      'border-2 hover:border-primary/20 bg-background/80 backdrop-blur',
                      achievement.link && 'cursor-pointer',
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              achievement.color === 'destructive'
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                : achievement.color === 'secondary'
                                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                  : 'bg-primary/10 text-primary',
                            )}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <Badge
                            variant={achievement.color}
                            className="font-semibold text-xs px-2 py-1"
                          >
                            {achievement.position}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {achievement.date}
                        </div>
                      </div>

                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {achievement.title}
                        {achievement.link && (
                          <ExternalLink className="inline h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </CardTitle>

                      <CardDescription className="font-medium text-muted-foreground">
                        <Building className="inline h-3 w-3 mr-1" />
                        {achievement.organization}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {achievement.description}
                      </p>

                      {achievement.link && (
                        <div className="mt-4 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {achievement.isInternal ? 'View project details' : 'Click to learn more'}{' '}
                          &rarr;
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CardWrapper>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
