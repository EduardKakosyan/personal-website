import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    technologies: ['OpenAI SDK', 'Azure OpenAI', 'LangGraph', 'Google AI Studio'],
    applications: ['Content Generation', 'Code Assistance', 'Document Analysis', 'Agentic Systems']
  },
  {
    title: 'Local AI Deployment',
    description: 'Hosting and optimizing AI models for privacy-focused and offline applications',
    technologies: ['Ollama', 'llama.cpp', 'Raspberry Pi', 'WebLLM', 'MLC-AI'],
    applications: ['Privacy-First Solutions', 'Edge Computing', 'Rapid Prototyping', 'Custom Fine-tuning']
  },
  {
    title: 'Tech Stack',
    description: 'Designing scalable, production-ready AI systems with modern frameworks',
    technologies: ['Next.js', 'Python', 'Typescript', 'Azure', 'Docker', 'FastAPI', 'N8N', 'Power Automate'],
    applications: ['Enterprise Solutions', 'Real-time Systems', 'API Development', 'Cloud Deployment']
  },
]

export function AIExpertiseSection() {
  return (
    <section className='py-12 md:py-24 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl mb-4'>
            Technical Expertise
          </h2>
          <p className='text-muted-foreground md:text-lg max-w-3xl mx-auto'>
            Experimenting with AI technologies, from local model deployment to enterprise-scale systems
          </p>
        </div>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {expertiseAreas.map((area, index) => (
            <Card key={index} className='h-full border-0 shadow-lg'>
              <CardHeader>
                <div className='flex items-center gap-3 mb-2'>
                  <CardTitle className='text-xl'>{area.title}</CardTitle>
                </div>
                <CardDescription className='text-base leading-relaxed'>
                  {area.description}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide'>
                    Technologies
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {area.technologies.map((tech, techIndex) => (
                      <Badge key={techIndex} variant='secondary' className='text-xs'>
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className='font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide'>
                    Applications
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {area.applications.map((app, appIndex) => (
                      <Badge key={appIndex} variant='outline' className='text-xs'>
                        {app}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 