import { getMarkdownContent } from '../lib/markdown'

export interface Project {
  slug: string
  title: string
  description: string
  longDescription: string
  tags: string[]
  imageUrl: string
  liveUrl?: string
  repoUrl?: string
  placement?: string
  featured?: boolean
}

// Get the markdown content for a project
const getProjectMarkdown = (slug: string): string => {
  return getMarkdownContent(`src/content/project-descriptions/${slug}.md`)
}

const allProjects: Project[] = [
  {
    slug: 'healthbyte',
    title: 'HealthByte - Atlantic AI Summit 2025',
    description: 'AI-driven agents to simulate public reactions to healthcare content and combat misinformation',
    longDescription: getProjectMarkdown('healthbyte'),
    tags: ['Python', 'OpenAI SDK', 'Azure OpenAI'],
    imageUrl: '',
    liveUrl: 'https://healthbyte-dashboard.vercel.app/',
    repoUrl: 'https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon',
    placement: 'First Place',
    featured: true
  },
  {
    slug: 'second-brain',
    title: 'Second Brain - Volta Hackathon',
    description: 'Time management agents to empower university students',
    longDescription: getProjectMarkdown('second-brain'),
    tags: ['N8N'],
    imageUrl: '',
    repoUrl: 'https://github.com/EduardKakosyan/volta_hackathon',
    placement: 'Second Place',
    featured: false
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    description: 'AI-powered car recommendation platform - ShiftKey Build',
    longDescription: getProjectMarkdown('cargrep'),
    tags: ['Vercel AI SDK', 'NextJS', 'Supabase'],
    imageUrl: '',
    liveUrl: 'https://www.cargrep.com',
    featured: true
  },
  {
    slug: 'network-sim',
    title: 'Q Learning Network Simulator',
    description: 'A comparative study of reinforcement learning-based routing (Q-routing) against traditional routing algorithms (Dijkstra and OSPF) in dynamic network environments',
    longDescription: getProjectMarkdown('network-sim'),
    tags: ['Python', 'SimPy', 'NetworkX', 'Q-Learning'],
    imageUrl: '',
    repoUrl: 'https://github.com/EduardKakosyan/network-sim',
    featured: true
  },
]

// Get all projects
export async function getAllProjects(): Promise<Project[]> {
  return allProjects
}

// Get a project by slug
export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  return allProjects.find((project) => project.slug === slug)
}

// Get featured projects (for homepage highlights)
export async function getFeaturedProjects(limit?: number): Promise<Project[]> {
  const featured = allProjects.filter(project => project.featured)
  return limit ? featured.slice(0, limit) : featured
}

export default allProjects 
