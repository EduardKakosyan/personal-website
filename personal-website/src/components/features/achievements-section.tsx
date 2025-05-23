import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Achievement {
  title: string
  position: string
  organization: string
  date: string
  description: string
  color: 'destructive' | 'secondary' | 'default' | 'outline'
}

const achievements: Achievement[] = [
  {
    title: 'Atlantic AI Summit 2025',
    position: 'First Place',
    organization: 'Atlantic Canada Universities',
    date: 'May 2025',
    description: 'Led team HealthByte to victory with AI-driven healthcare misinformation combat platform among 20 university teams.',
    color: 'destructive'
  },
  {
    title: 'AI Developer',
    position: 'Professional Role',
    organization: 'AI-First Consulting',
    date: 'Current',
    description: 'Building AI solutions for enterprise clients, specializing in intelligent automation and LLM integration.',
    color: 'default'
  },
  {
    title: 'Volta Hackathon',
    position: 'Second Place',
    organization: 'Volta Innovation',
    date: 'December 2024',
    description: 'Developed Second Brain, an AI-powered time management platform for university students.',
    color: 'secondary'
  },
]

export function AchievementsSection() {
  return (
    <section className='py-12 md:py-24 bg-secondary/20 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl mb-4'>
            Recent Activities 
          </h2>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {achievements.map((achievement, index) => (
            <Card key={index} className='h-full'>
              <CardHeader>
                <div className='flex items-center justify-between mb-2'>
                  <Badge variant={achievement.color} className='font-semibold'>
                    {achievement.position}
                  </Badge>
                  <span className='text-sm text-muted-foreground'>{achievement.date}</span>
                </div>
                <CardTitle className='text-xl'>{achievement.title}</CardTitle>
                <CardDescription className='font-medium text-primary'>
                  {achievement.organization}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {achievement.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 