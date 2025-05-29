'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Building, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Achievement {
  title: string
  position: string
  organization: string
  date: string
  description: string
  color: 'destructive' | 'secondary' | 'default' | 'outline'
  icon: React.ElementType
  link?: string
}

const achievements: Achievement[] = [
  {
    title: 'Atlantic AI Summit 2025',
    position: 'First Place 🏆',
    organization: 'Atlantic Canada Universities',
    date: 'May 2025',
    description: 'Developed llm-powered personas to simulate change in human behavior to real/fake Covid-19 news.',
    color: 'destructive',
    icon: Trophy,
    link: 'https://healthbyte-dashboard.vercel.app/'
  },
  {
    title: 'AI Developer',
    position: 'Professional Role',
    organization: 'AI-First Consulting',
    date: 'Current',
    description: 'Building AI solutions for SMBs all across Atlantic Canada, specializing in intelligent automation and LLM integration.',
    color: 'default',
    icon: Building,
    link: 'https://www.ai-first.ca/'
  },
  {
    title: 'Volta Hackathon',
    position: 'Second Place 🥈',
    organization: 'Volta Innovation',
    date: 'December 2024',
    description: 'Developed Second Brain, an AI-powered time management platform for university students.',
    color: 'secondary',
    icon: Trophy
  },
]

export function AchievementsSection() {
  const [visibleCards, setVisibleCards] = useState<boolean[]>([])
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = cardRefs.current.map((ref, index) => {
      if (!ref) return null
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => {
              const newState = [...prev]
              newState[index] = true
              return newState
            })
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      )
      
      observer.observe(ref)
      return observer
    })

    return () => {
      observers.forEach(observer => observer?.disconnect())
    }
  }, [])

  return (
    <section className='py-16 md:py-24 bg-gradient-to-b from-secondary/10 via-secondary/20 to-secondary/10 w-full relative overflow-hidden'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]' />
      
      <div className='relative container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-12 space-y-4'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border text-sm text-primary font-medium'>
            <Trophy className='h-4 w-4' />
            Achievements & Experience
          </div>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight'>
            Recent <span className='text-primary'>Milestones</span>
          </h2>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Key achievements and professional highlights from my journey in AI development
          </p>
        </div>
        
        <div className='grid gap-6 md:gap-8 sm:grid-cols-1 lg:grid-cols-3'>
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon
            const isVisible = visibleCards[index]
            
            return (
              <div
                key={index}
                ref={el => { cardRefs.current[index] = el }}
                className={cn(
                  'transition-all duration-700 ease-out',
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className={cn(
                  'h-full group hover:shadow-xl transition-all duration-300 cursor-pointer',
                  'border-2 hover:border-primary/20 bg-background/80 backdrop-blur',
                  achievement.link && 'hover:scale-105 haptic-medium'
                )}
                onClick={() => achievement.link && window.open(achievement.link, '_blank')}
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div className={cn(
                          'p-2 rounded-lg transition-colors',
                          achievement.color === 'destructive' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                          achievement.color === 'secondary' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                          'bg-primary/10 text-primary'
                        )}>
                          <IconComponent className='h-5 w-5' />
                        </div>
                        <Badge 
                          variant={achievement.color} 
                          className='font-semibold text-xs px-2 py-1'
                        >
                          {achievement.position}
                        </Badge>
                      </div>
                      
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <Calendar className='h-3 w-3' />
                        {achievement.date}
                      </div>
                    </div>
                    
                    <CardTitle className='text-xl group-hover:text-primary transition-colors'>
                      {achievement.title}
                      {achievement.link && (
                        <ExternalLink className='inline h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                      )}
                    </CardTitle>
                    
                    <CardDescription className='font-medium text-muted-foreground'>
                      <Building className='inline h-3 w-3 mr-1' />
                      {achievement.organization}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {achievement.description}
                    </p>
                    
                    {achievement.link && (
                      <div className='mt-4 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity'>
                        Click to learn more →
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
        
        {/* Mobile scroll hint */}
        <div className='md:hidden mt-8 flex justify-center'>
          <div className='text-xs text-muted-foreground flex items-center gap-2'>
            <span>Tap cards to explore</span>
            <div className='flex gap-1'>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className='w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse'
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 