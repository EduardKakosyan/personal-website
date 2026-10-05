import { ProjectsPageContent } from '@/components/features/projects-page-content'
import { getAllProjects, getCategories } from '@/content/projects'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Things I’ve been building, from local coding agents and voice assistants to hackathon projects with teammates.',
}

export default async function ProjectsPage() {
  const projects = await getAllProjects()
  const categories = getCategories()

  return <ProjectsPageContent projects={projects} categories={categories} />
}
