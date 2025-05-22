import { getMarkdownContent } from '../lib/markdown'

export interface Project {
  slug: string
  title: string
  description: string
  longDescription: string
  tags: string[]
  imageUrl?: string
  liveUrl?: string
  repoUrl?: string
  placement?: string
  featured?: boolean
  category?: string
  completionDate?: string
  teamSize?: number
  duration?: string
  highlights?: string[]
}

const getProjectMarkdown = (slug: string): string => {
  return getMarkdownContent(`src/content/project-descriptions/${slug}.md`)
}

const allProjects: Project[] = [
  {
    slug: 'healthbyte',
    title: 'HealthByte',
    description: 'AI-powered platform that combats healthcare misinformation by simulating public reactions to medical content before publication. Uses reinforcement learning agents to optimize messaging for diverse demographics.',
    longDescription: getProjectMarkdown('healthbyte'),
    tags: ['Python', 'OpenAI o4-mini', 'Gemini 2.5 flash', 'Reinforcement Learning', 'Multi-Agent Systems', 'Prompt Engineering'],
    liveUrl: 'https://healthbyte-dashboard.vercel.app/',
    repoUrl: 'https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon',
    placement: 'First Place',
    featured: true,
    category: 'AI/ML',
    completionDate: 'May 2025',
    teamSize: 4,
    duration: '48 hours',
    highlights: [
      'Won 1st place among 20 university teams',
      'Novel two-agent reinforcement learning system',
      'Real-time persona modeling and content optimization',
      'Proactive misinformation detection approach'
    ]
  },
  {
    slug: 'second-brain',
    title: 'Second Brain',
    description: 'Intelligent time management and learning assistant designed for university students. Integrates with Google Drive and calendar systems to automatically process academic documents and schedule study sessions.',
    longDescription: getProjectMarkdown('second-brain'),
    tags: ['n8n', 'Pinecone', 'Vector Database', 'Google Drive API', 'Calendar Integration', 'Workflow Automation', 'AI Assistant', 'RAG'],
    repoUrl: 'https://github.com/EduardKakosyan/volta_hackathon',
    placement: 'Second Place',
    featured: false,
    category: 'Productivity',
    completionDate: '2024',
    teamSize: 3,
    duration: '48 hours',
    highlights: [
      'Automated document processing every 10 minutes',
      'Intelligent syllabus parsing for exam scheduling',
      'Vector-based knowledge retrieval system',
      'Seamless calendar integration with conflict detection'
    ]
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    description: 'AI-driven car recommendation platform that transforms the overwhelming car-buying experience into a personalized journey. Features real-time market monitoring and intelligent matching algorithms.',
    longDescription: getProjectMarkdown('cargrep'),
    tags: ['Next.js 15', 'Vercel AI SDK', 'Azure OpenAI', 'Supabase', 'TypeScript', 'Tailwind CSS', 'Radix UI', 'Clerk', 'Stripe', 'Real-time Data'],
    liveUrl: 'https://www.cargrep.com',
    featured: true,
    category: 'Full-Stack',
    completionDate: '2024',
    teamSize: 1,
    duration: '6 weeks',
    highlights: [
      'Live platform serving real users',
      'Aggregates data from major Canadian marketplaces',
      'AI-powered conversational interface',
      'Real-time deal alerts and price monitoring',
      'Sub-second response times with edge functions'
    ]
  },
  {
    slug: 'network-sim',
    title: 'Q-Learning Network Simulator',
    description: 'Comprehensive network simulation platform comparing reinforcement learning-based routing (Q-routing) against traditional algorithms like Dijkstra and OSPF in dynamic network environments.',
    longDescription: getProjectMarkdown('network-sim'),
    tags: ['Python 3.13', 'SimPy', 'NetworkX', 'Q-Learning', 'Reinforcement Learning', 'Network Simulation', 'Performance Analysis', 'OSPF', 'Graph Theory'],
    repoUrl: 'https://github.com/EduardKakosyan/network-sim',
    featured: true,
    category: 'Research',
    completionDate: '2024',
    teamSize: 3,
    duration: '4 months',
    highlights: [
      'Advanced discrete event simulation using SimPy',
      'Comparative analysis of 3 routing algorithms',
      'Support for multiple network topologies',
      'Comprehensive performance metrics tracking',
      'Real-time adaptive routing decisions'
    ]
  },
]

export async function getAllProjects(): Promise<Project[]> {
  return allProjects
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  return allProjects.find((project) => project.slug === slug)
}

export async function getFeaturedProjects(limit?: number): Promise<Project[]> {
  const featured = allProjects.filter(project => project.featured)
  return limit ? featured.slice(0, limit) : featured
}

export async function getProjectsByCategory(category: string): Promise<Project[]> {
  return allProjects.filter(project => project.category === category)
}

export async function getCompetitionProjects(): Promise<Project[]> {
  return allProjects.filter(project => project.placement)
}

export default allProjects 
