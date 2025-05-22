import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface SkillCategory {
  title: string
  skills: string[]
  description?: string
}

const skillCategories: SkillCategory[] = [
  {
    title: 'Programming Languages',
    skills: ['Python', 'Java', 'C', 'Rust', 'SQL'],
  },
  {
    title: 'AI & Machine Learning',
    skills: ['LangGraph', 'OpenAI SDK', 'Ollama', 'Azure OpenAI', 'LangChain', 'SimPy', 'NetworkX'],
    description: 'My expertise spans various cutting-edge tools and frameworks, allowing me to build robust and intelligent systems.',
  },
  {
    title: 'Tools & Platforms',
    skills: ['Git', 'GitHub', 'AWS', 'Docker', 'Linux', 'MacOS', 'Windows', 'Cursor', 'NVIM', 'OrbStack', 'Tmux'],
  },
]

export function SkillsShowcase() {
  return (
    <section className='py-12 md:py-24 bg-muted/40 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <h2 className='mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl'>
          My Technical Expertise
        </h2>
        <div className='grid gap-8 md:grid-cols-2'>
          {skillCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle>{category.title}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className='flex flex-wrap gap-2'>
                {category.skills.map((skill) => (
                  <Badge key={skill} variant='secondary' className='text-sm'>
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 