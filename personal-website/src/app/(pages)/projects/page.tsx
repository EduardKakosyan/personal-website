import { ProjectCard } from '@/components/features/project-card'
import { getAllProjects, type Project } from '@/content/projects'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Projects | AI Developer',
  description: 'Explore a collection of AI and web development projects I have worked on.',
}

export default function ProjectsPage() {
  const allProjects = getAllProjects()

  return (
    <div className='container py-12 md:py-16'>
      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl'>
          My Portfolio
        </h1>
        <p className='mt-3 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl'>
          Here are some of the projects I&apos;ve passionately worked on, showcasing my skills in AI and software development.
        </p>
      </div>

      {allProjects.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8'>
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
