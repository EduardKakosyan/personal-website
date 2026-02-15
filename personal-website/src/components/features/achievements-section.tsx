'use client'

import { Badge } from '@/components/ui/badge'
import { ExternalLink, GraduationCap, Trophy, Users, Presentation } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { analyticsEvents } from '@/lib/analytics'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

type ActivityType = 'teaching' | 'hackathon' | 'client' | 'workshop'

interface Activity {
  title: string
  type: ActivityType
  date: string
  description: string
  badge?: string
  link?: string
  isInternal?: boolean
}

const activities: Activity[] = [
  {
    title: 'AI Workshops for Executive Search',
    type: 'workshop',
    date: 'Feb 2026',
    description:
      'Demonstrated AI capabilities to executive search companies globally through 4 workshops.',
  },
  {
    title: 'Digital Nova Scotia SFHA-DS & ML',
    type: 'teaching',
    date: 'Nov 2025 – Present',
    description:
      'Developing the Advanced Data Science & Machine Learning curriculum for 150+ participants. Handcrafted courses and assignments inspired by the Dalhousie course, in collaboration with Shiftkey Labs.',
  },
  {
    title: 'Agentic AI Course @ Dalhousie',
    type: 'teaching',
    date: 'Sep – Oct 2025',
    description:
      'Taught generative AI and agents to 70+ students in collaboration with Shiftkey Labs. Students built solutions for real-life problems.',
  },
  {
    title: '20+ Client Agent Deployments',
    type: 'client',
    date: '2025 – Present',
    description:
      'Built live agents for consulting firms (RFP sorting through thousands of documents), engineering companies (knowledge-base Q&A), and legal document processing. Over 20 clients with fully functional agents deployed.',
  },
  {
    title: 'Atlantic AI Summit',
    type: 'hackathon',
    date: 'May 2025',
    badge: 'First Place',
    description:
      'Built HealthByte: LLM-powered personas simulating human behavior changes to real/fake Covid-19 news.',
    link: '/projects/healthbyte',
    isInternal: true,
  },
  {
    title: 'Volta Hackathon',
    type: 'hackathon',
    date: 'Dec 2024',
    badge: 'Second Place',
    description: 'Built Second Brain: AI-powered time management platform for university students.',
    link: '/projects/second-brain',
    isInternal: true,
  },
]

const typeConfig: Record<
  ActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  teaching: {
    icon: GraduationCap,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  },
  hackathon: {
    icon: Trophy,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  },
  client: {
    icon: Users,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  },
  workshop: {
    icon: Presentation,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function AchievementsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section
      className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 via-secondary/20 to-secondary/10 w-full relative overflow-hidden"
      data-section="achievements"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

      <div className="relative container mx-auto px-4 max-w-4xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border text-sm text-primary font-medium">
            <Trophy className="h-4 w-4" />
            Recent Activity
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            What I&apos;ve Been{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent-neon), oklch(0.70 0.15 260))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Up To
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Teaching, building, and competing — here&apos;s what I&apos;ve been working on lately
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-8">
            {activities.map((activity, index) => {
              const config = typeConfig[activity.type]
              const IconComponent = config.icon

              const content = (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative pl-12 md:pl-16 group"
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-2 md:left-4 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background',
                      config.color,
                    )}
                  >
                    <IconComponent className="h-3 w-3" />
                  </div>

                  {/* Card */}
                  <div
                    className={cn(
                      'p-5 rounded-lg border bg-background/80 backdrop-blur transition-all duration-300',
                      activity.link && 'hover:shadow-lg hover:border-primary/20 cursor-pointer',
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                        {activity.title}
                        {activity.link && (
                          <ExternalLink className="h-4 w-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                        )}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {activity.badge && (
                          <Badge variant="destructive" className="text-xs font-semibold">
                            {activity.badge}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.date}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {activity.description}
                    </p>
                  </div>
                </motion.div>
              )

              if (activity.link) {
                if (activity.isInternal) {
                  return (
                    <Link
                      key={index}
                      href={activity.link}
                      onClick={() => analyticsEvents.achievementClicked(activity.title)}
                    >
                      {content}
                    </Link>
                  )
                }
                return (
                  <a
                    key={index}
                    href={activity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => analyticsEvents.achievementClicked(activity.title)}
                  >
                    {content}
                  </a>
                )
              }

              return <div key={index}>{content}</div>
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
