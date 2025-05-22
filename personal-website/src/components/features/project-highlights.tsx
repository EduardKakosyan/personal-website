import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getFeaturedProjects } from '@/content/projects'

export async function ProjectHighlights() {
  const highlightedProjects = await getFeaturedProjects(3)

  return (
    <section className='py-12 md:py-24 w-full'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <h2 className='mb-8 text-center text-3xl font-bold tracking-tighter sm:text-4xl'>
          Projects
        </h2>
        <div className='flex justify-center'>
          <div className='grid gap-6 md:grid-cols-2 lg:gap-8 w-full'>
            {highlightedProjects.map((project) => (
              <Card key={project.slug}>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  {project.placement && (
                    <div className="mt-2 mb-2">
                      <Badge variant="destructive">{project.placement}</Badge>
                    </div>
                  )}
                  <CardDescription className='line-clamp-3'>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='mb-4 flex flex-wrap gap-2'>
                    {project.tags.map((tag) => (
                      <span key={tag} className='rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground'>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button asChild variant='outline'>
                    <Link href={`/projects/${project.slug}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className='mt-12 text-center'>
          <Button asChild size='lg'>
            <Link href='/projects'>Explore All Projects</Link>
          </Button>
        </div>
      </div>
    </section>
  )
} 
