import { getMarkdownContent } from '../lib/markdown'

export interface Project {
  slug: string
  title: string
  description: string
  longDescription: string
  tags: string[]
  imageUrl?: string
  previewImageUrl?: string
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
    slug: 'acdc-dashboard',
    title: 'ACDC Dashboard',
    description:
      'Full-stack consulting business health platform tracking Attract, Convert, Deliver, and Collect cycles. Combines CRM, BI analytics, time tracking, financial reporting, AI document extraction, and LinkedIn content generation into a single unified dashboard.',
    longDescription: getProjectMarkdown('acdc-dashboard'),
    previewImageUrl: undefined,
    tags: [
      'Next.js 16',
      'React 19',
      'TypeScript',
      'Supabase',
      'Claude Sonnet 4',
      'Azure OpenAI',
      'QuickBooks API',
      'Microsoft Graph',
      'LinkedIn API',
      'Recharts',
      'Tailwind CSS',
    ],
    featured: true,
    category: 'Full-Stack',
    completionDate: '2025',
    teamSize: 1,
    duration: 'Ongoing',
    highlights: [
      '35+ PostgreSQL tables with Row Level Security',
      'AI-powered RFP extraction with Claude Sonnet 4',
      '6 external API integrations (QBO, LinkedIn, Graph, PostHog, Perplexity)',
      'Real-time D3 business health gauges with automated weekly snapshots',
      'Dual AI provider content generation with voice profiling',
    ],
  },
  {
    slug: 'dev-template',
    title: 'Dev Template',
    description:
      'Open source tooling-only starter template optimized for agentic AI development. Pre-configured with 6 specialized Claude Code sub-agents, 30+ slash commands, three-layer git hook protection, CI/CD, and a persistent AI knowledge base.',
    longDescription: getProjectMarkdown('dev-template'),
    previewImageUrl: 'https://opengraph.githubassets.com/1/AI-First-Consulting/dev-template',
    tags: [
      'TypeScript',
      'Claude Code',
      'CrewAI',
      'Vitest',
      'ESLint 9',
      'Husky',
      'Gitleaks',
      'GitHub Actions',
      'Changesets',
      'pnpm',
    ],
    repoUrl: 'https://github.com/AI-First-Consulting/dev-template',
    featured: true,
    category: 'Developer Tools',
    completionDate: '2026',
    teamSize: 1,
    duration: 'Ongoing',
    highlights: [
      '6 specialized AI sub-agents for codebase research',
      '30+ slash commands for plan-driven development',
      'Three-layer git hook protection (secrets, lint, local CI)',
      'Persistent AI knowledge base across sessions',
      'Zero application code — pure development infrastructure',
    ],
  },
  {
    slug: 'hugo',
    title: 'HUGO',
    description:
      'Voice-first personal assistant embodied in a Reachy Mini robot. Uses multi-agent AI orchestration with 7 specialist agents to manage email, calendar, project management, and meeting transcripts — all through natural voice commands running locally on Apple Silicon.',
    longDescription: getProjectMarkdown('hugo'),
    previewImageUrl: 'https://opengraph.githubassets.com/1/EduardKakosyan/hugo',
    tags: [
      'Python',
      'CrewAI',
      'MLX',
      'Whisper',
      'Pipecat',
      'FastMCP',
      'Qwen3-32B',
      'Semantic Router',
      'Reachy Mini',
      'Pydantic',
    ],
    repoUrl: 'https://github.com/EduardKakosyan/hugo',
    featured: true,
    category: 'AI/ML',
    completionDate: '2025',
    teamSize: 1,
    duration: 'Ongoing',
    highlights: [
      '7 specialist AI agents orchestrated with CrewAI',
      '90% local inference on Apple Silicon via MLX',
      'Sub-millisecond semantic intent routing',
      'MCP servers for Microsoft Graph, Linear, and Fireflies.ai',
      'Physical robot embodiment with emotional expressions',
    ],
  },
  {
    slug: 'healthbyte',
    title: 'HealthByte',
    description:
      'AI-powered platform that combats healthcare misinformation by simulating public reactions to medical content before publication. Uses reinforcement learning agents to optimize messaging for diverse demographics.',
    longDescription: getProjectMarkdown('healthbyte'),
    previewImageUrl: 'https://healthbyte-dashboard.vercel.app/og-image.png',
    tags: [
      'Python',
      'OpenAI o4-mini',
      'Gemini 2.5 flash',
      'Reinforcement Learning',
      'Multi-Agent Systems',
      'Prompt Engineering',
    ],
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
      'Proactive misinformation detection approach',
    ],
  },
  {
    slug: 'second-brain',
    title: 'Second Brain',
    description:
      'Intelligent time management and learning assistant designed for university students. Integrates with Google Drive and calendar systems to automatically process academic documents and schedule study sessions.',
    longDescription: getProjectMarkdown('second-brain'),
    previewImageUrl: 'https://opengraph.githubassets.com/1/EduardKakosyan/volta_hackathon',
    tags: [
      'n8n',
      'Pinecone',
      'Vector Database',
      'Google Drive API',
      'Calendar Integration',
      'Workflow Automation',
      'AI Assistant',
      'RAG',
    ],
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
      'Seamless calendar integration with conflict detection',
    ],
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    description:
      'AI-driven car recommendation platform that transforms the overwhelming car-buying experience into a personalized journey. Features real-time market monitoring and intelligent matching algorithms.',
    longDescription: getProjectMarkdown('cargrep'),
    previewImageUrl: 'https://www.cargrep.com/og-image.png',
    tags: [
      'Next.js 15',
      'Vercel AI SDK',
      'Azure OpenAI',
      'Supabase',
      'TypeScript',
      'Tailwind CSS',
      'Radix UI',
      'Clerk',
      'Stripe',
      'Real-time Data',
    ],
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
      'Sub-second response times with edge functions',
    ],
  },
  {
    slug: 'network-sim',
    title: 'Q-Learning Network Simulator',
    description:
      'Comprehensive network simulation platform comparing reinforcement learning-based routing (Q-routing) against traditional algorithms like Dijkstra and OSPF in dynamic network environments.',
    longDescription: getProjectMarkdown('network-sim'),
    previewImageUrl: 'https://opengraph.githubassets.com/1/EduardKakosyan/q-learning-network-sim',
    tags: [
      'Python 3.13',
      'SimPy',
      'NetworkX',
      'Q-Learning',
      'Reinforcement Learning',
      'Network Simulation',
      'Performance Analysis',
      'OSPF',
      'Graph Theory',
    ],
    repoUrl: 'https://github.com/EduardKakosyan/q-learning-network-sim',
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
      'Real-time adaptive routing decisions',
    ],
  },
]

export async function getAllProjects(): Promise<Project[]> {
  return allProjects
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  return allProjects.find((project) => project.slug === slug)
}

export async function getFeaturedProjects(limit?: number): Promise<Project[]> {
  const featured = allProjects.filter((project) => project.featured)
  return limit ? featured.slice(0, limit) : featured
}

export async function getProjectsByCategory(category: string): Promise<Project[]> {
  return allProjects.filter((project) => project.category === category)
}

export async function getCompetitionProjects(): Promise<Project[]> {
  return allProjects.filter((project) => project.placement)
}

export function getCategories(): string[] {
  const categories = new Set(allProjects.map((p) => p.category).filter(Boolean) as string[])
  return ['All', ...Array.from(categories)]
}

export function getAdjacentProjects(slug: string): { prev: Project | null; next: Project | null } {
  const index = allProjects.findIndex((p) => p.slug === slug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? allProjects[index - 1] : null,
    next: index < allProjects.length - 1 ? allProjects[index + 1] : null,
  }
}

export default allProjects
