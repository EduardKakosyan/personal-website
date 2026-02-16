import { ProjectsPageContent } from '@/components/features/projects-page-content'
import { getAllProjects, getCategories } from '@/content/projects'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Projects | AI Developer',
  description: 'Explore a collection of AI and web development projects I have worked on.',
}

export default async function ProjectsPage() {
  const projects = await getAllProjects()
  const categories = getCategories()

  return <ProjectsPageContent projects={projects} categories={categories} />
}
