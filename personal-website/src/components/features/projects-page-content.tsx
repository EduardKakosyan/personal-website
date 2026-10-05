'use client'
import { useState } from 'react'
import { ProjectCard } from '@/components/features/project-card'
import type { Project } from '@/content/projects'

export function ProjectsPageContent({
  projects,
  categories,
}: {
  projects: Project[]
  categories: string[]
}) {
  const [category, setCategory] = useState('All')
  const filtered = projects.filter((project) => category === 'All' || project.category === category)
  return (
    <section className="lab-section">
      <header className="projects-intro">
        <span className="eyebrow">LOCAL AI / AGENTS / SOFTWARE</span>
        <h1>Projects</h1>
        <p>
          Things I’ve been building lately, plus some earlier work and projects built with teammates
          at hackathons.
        </p>
      </header>
      <div className="projects-filter" aria-label="Filter projects">
        {categories.map((item) => (
          <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="projects-grid">
        {filtered.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      {!filtered.length && <p>No projects in this category.</p>}
    </section>
  )
}
