import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const skillCategories = [
  {
    title: 'Programming Languages',
    skills: ['Python', 'TypeScript', 'JavaScript', 'SQL'],
  },
  {
    title: 'AI & Machine Learning',
    skills: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'LLMs'],
  },
  {
    title: 'Web Technologies',
    skills: ['Next.js', 'React', 'Node.js', 'Tailwind CSS', 'Supabase', 'Docker'],
  },
  {
    title: 'Tools & Platforms',
    skills: ['Git', 'GitHub', 'VS Code', 'Jupyter Notebooks', 'Vercel'],
  },
]

export function SkillsShowcase() {
  return (
    <section className='py-12 md:py-24 bg-muted/40'>
      <div className='container'>
        <h2 className='mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl'>
          My Technical Expertise
        </h2>
        <div className='grid gap-8 md:grid-cols-2'>
          {skillCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle>{category.title}</CardTitle>
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