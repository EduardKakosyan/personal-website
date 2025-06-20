import { ProjectCard } from '@/components/features/project-card'
import { getAllProjects } from '@/content/projects'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Projects | AI Developer',
  description: 'Explore a collection of AI and web development projects I have worked on.',
}

export default async function ProjectsPage() {
  const allProjects = await getAllProjects()

  return (
    <div className='container py-12 md:py-16'>
      <div className='mb-12 text-center max-w-3xl mx-auto'>
        <h1 className='text-4xl font-bold tracking-tight mb-4'>
          Projects
        </h1>
        <p className='text-xl text-muted-foreground'>
          Here are some of the projects I've passionately worked on, showcasing my skills in AI and software development.
        </p>
      </div>

      {allProjects.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 items-stretch'>
          {allProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className='text-center text-muted-foreground'>
          No projects to display at the moment. Please check back soon!
        </p>
      )}
    </div>
  )
} 
