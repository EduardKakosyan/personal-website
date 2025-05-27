import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface SkillCategory {
  title: string
  skills: string[]
  description: string
  context: string
  icon: string
}

const skillCategories: SkillCategory[] = [
  {
    title: 'Programming Languages',
    skills: ['Python', 'Java', 'C', 'Rust', 'SQL', 'TypeScript', 'JavaScript'],
    description: 'The tools I reach for when building solutions',
    context: 'Python for AI projects and data work, Java from university, C for systems programming, Rust when I want to challenge myself, SQL for database work, and TypeScript/JavaScript for web development.',
    icon: '💻'
  },
  {
    title: 'AI & Machine Learning',
    skills: ['OpenAI SDK', 'Azure OpenAI', 'Ollama', 'llama.cpp', 'LangGraph', 'n8n', 'WebLLM', 'WebGPU' ],
    description: 'Where I spend most of my time these days',
    context: 'Building agentic AI with OpenAI and Azure, running local models with Ollama on my MacBook for unlimited tokens, and creating multi-agent systems with LangGraph.',
    icon: '🤖'
  },
  {
    title: 'Web Development',
    skills: ['Next.js', 'React', 'Vercel', 'Supabase', 'Tailwind CSS', 'shadcn/ui', 'Clerk', 'Stripe'],
    description: 'Building full-stack applications that people actually use',
    context: 'From this portfolio site to CarGrep, I use Next.js for everything. Supabase for databases, Clerk for auth, and Tailwind because writing CSS from scratch is painful. Zed for code editing.',
    icon: '🌐'
  },
  {
    title: 'Tools & Environment',
    skills: ['Git', 'Docker', 'Linux', 'macOS', 'Cursor', 'NVIM', 'Tmux', 'n8n', 'OrbStack', 'Zed'],
    description: 'The daily drivers that keep me productive',
    context: 'Currently jumping between different editors experimenting with Zed, Cursor and my go to Nvim, Tmux for terminal management, and Alacritty for the terminal. OrbStack for better Docker and Linux experience. Vivaldi for the browser. If you are interested in my dotfiles, check out my GitHub repo.',
    icon: '🛠️'
  },
  {
    title: 'Cloud & Infrastructure',
    skills: ['AWS', 'Azure', 'Vercel', 'Google Cloud', 'Docker', 'API Design', 'Database Design'],
    description: 'Deploying and scaling applications',
    context: 'Azure for AI services, Vercel for web apps, AWS for general cloud needs (AWS Certified Cloud Practitioner). I enjoy designing APIs that are actually pleasant to use and databases that make sense.',
    icon: '☁️'
  },
]

export function SkillsShowcase() {
  return (
    <section className='py-12 md:py-24 bg-muted/40 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl mb-4'>
            What I Work With
          </h2>
          <p className='text-muted-foreground md:text-lg max-w-2xl mx-auto'>
            Here&apos;s my technical toolkit and how I actually use it in practice
          </p>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {skillCategories.map((category) => (
            <Card key={category.title} className='h-full'>
              <CardHeader className='pb-4'>
                <div className='flex items-center gap-3 mb-2'>
                  <span className='text-2xl'>{category.icon}</span>
                  <CardTitle className='text-lg'>{category.title}</CardTitle>
                </div>
                <CardDescription className='text-sm font-medium text-primary'>
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {category.context}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {category.skills.map((skill) => (
                    <Badge key={skill} variant='outline' className='text-xs'>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className='mt-12 text-center'>
          <Card className='max-w-3xl mx-auto bg-muted/20 border-dashed'>
            <CardContent className='p-6'>
              <h3 className='font-semibold text-lg mb-2'>Always Learning</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                The tech world moves fast, and I enjoy keeping up. Currently exploring: advanced prompt engineering techniques, 
                local AI model optimization, and better ways to build user-friendly AI applications. 
                If you&apos;re working on something interesting, I&apos;d love to hear about it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 