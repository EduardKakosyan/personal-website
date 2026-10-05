import { getMarkdownContent } from '../lib/markdown'
import { portfolioWorks } from './portfolio'

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

const newProjects: Project[] = portfolioWorks
  .filter((work) => ['dgx-autonomy', 'shoreline', 'yahtzee'].includes(work.slug))
  .map((work) => ({
    slug: work.slug,
    title: work.title,
    description: work.summary,
    longDescription: getProjectMarkdown(work.slug),
    tags: [...work.tags],
    repoUrl: work.repo,
    featured: work.featured,
    completionDate: 'September 2026',
    category: work.slug === 'dgx-autonomy' ? 'AI/ML' : 'Agent-built Apps',
    previewImageUrl:
      work.slug === 'shoreline'
        ? '/images/shoreline.png'
        : work.slug === 'yahtzee'
          ? '/images/yahtzee.png'
          : undefined,
    liveUrl:
      work.slug === 'shoreline'
        ? 'https://eduardkakosyan.github.io/shoreline/'
        : work.slug === 'yahtzee'
          ? 'https://eduardkakosyan.github.io/yahtzee/'
          : undefined,
    highlights:
      work.slug === 'dgx-autonomy'
        ? [
            'Independent evaluation against frozen checks',
            'Validated handoffs across conversations',
            'Isolated builder and evaluator containers',
          ]
        : undefined,
  }))

const allProjects: Project[] = [
  ...newProjects,
  {
    slug: 'claude-autonomous',
    title: 'Claude Autonomous',
    description:
      'My earlier setup for running Claude Code overnight, with a Docker container, spending limits, and saved progress between runs.',
    longDescription: getProjectMarkdown('claude-autonomous'),
    previewImageUrl: undefined,
    tags: [
      'Docker',
      'Bash',
      'Claude Code',
      'launchd',
      'iptables',
      'Go',
      'OrbStack',
      'GitHub Actions',
    ],
    repoUrl: 'https://github.com/EduardKakosyan/claude-autonomous',
    featured: true,
    category: 'Developer Tools',
    completionDate: 'March 2026',
    teamSize: 1,
    duration: '1 week',
    highlights: [
      'One-command setup: Docker build, launchd install, git hooks',
      'Budget enforcement: $100/day cap, 3-hour timeout, 500 max turns',
      'Container firewall blocking private network access',
      'Persistent task backlog with dependency tracking across runs',
      'Used for the VoxCoach build across 47 tasks',
    ],
  },
  {
    slug: 'voxcoach',
    title: 'VoxCoach',
    description:
      'A tool for practising sales calls with a simulated buyer and reviewing the conversation afterwards. The voice and language models run locally on Apple Silicon.',
    longDescription: getProjectMarkdown('voxcoach'),
    previewImageUrl: '/images/voxcoach.png',
    tags: [
      'Go',
      'voxtral.c',
      'Silero VAD',
      'Qwen 3',
      'Kokoro TTS',
      'Ollama',
      'Supabase',
      'WebSocket',
      'CGo',
      'Metal GPU',
    ],
    repoUrl: 'https://github.com/EduardKakosyan/voxcoach',
    featured: false,
    category: 'AI/ML',
    completionDate: 'March 2026',
    teamSize: 1,
    duration: '2 weeks',
    highlights: [
      'Local speech recognition and synthesis on Apple Silicon',
      'Overlapped LLM/TTS streaming with barge-in support',
      '6-phase discovery call simulation with 5 buyer archetypes',
      'Post-call scoring on 7 consultative selling criteria',
      'Built autonomously by Claude Code across 12+ nightly runs',
    ],
  },
  {
    slug: 'dev-template',
    title: 'Dev Template',
    description:
      'The agent commands, checks, and Git hooks I put together for starting projects at AI-First Consulting.',
    longDescription: getProjectMarkdown('dev-template'),
    previewImageUrl: undefined,
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
      '6 specialized sub-agents for codebase research',
      '30+ slash commands for plan-driven development',
      'Git hooks for secret scanning, linting, and local CI',
      'Persistent knowledge base across sessions',
      'Zero application code — pure development infrastructure',
    ],
  },
  {
    slug: 'hugo',
    title: 'HUGO',
    description:
      'A voice assistant for my Reachy Mini robot, with speech recognition, language models, tool calls, and speech synthesis running locally on a DGX Spark.',
    longDescription: getProjectMarkdown('hugo'),
    previewImageUrl: undefined,
    tags: [
      'Python',
      'DGX Spark',
      'Reachy Mini',
      'vLLM',
      'Nemotron',
      'Parakeet',
      'Qwen3-TTS',
      'Silero VAD',
    ],
    repoUrl: 'https://github.com/EduardKakosyan/hugo',
    featured: true,
    category: 'AI/ML',
    completionDate: '2026',
    teamSize: 1,
    duration: 'Ongoing',
    highlights: [
      'Local speech recognition, reasoning, tools and synthesis',
      'Streaming voice loop with follow-up conversation',
      'Wake-word and voice-activity detection',
      'Integration with a Reachy Mini robot body',
    ],
  },
  {
    slug: 'healthbyte',
    title: 'HealthByte',
    description:
      'A hackathon project we built to explore how simulated readers respond to healthcare articles, with a second agent revising the text from their feedback.',
    longDescription: getProjectMarkdown('healthbyte'),
    previewImageUrl: undefined,
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
      'Our team took first place at the Atlantic AI Summit 2025',
      'Two-agent reinforcement learning loop (persona + editor)',
      'Persona modeling across diverse demographics',
      'Article revisions and simulated reactions shown side by side',
    ],
  },
  {
    slug: 'second-brain',
    title: 'Second Brain',
    description:
      'A study assistant we built at a hackathon. It searches course files in Google Drive and helps put study sessions and exam dates on a calendar.',
    longDescription: getProjectMarkdown('second-brain'),
    previewImageUrl: undefined,
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
      'Syllabus parsing for automatic exam scheduling',
      'Vector-based knowledge retrieval system',
      'Calendar integration with conflict detection',
    ],
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    description:
      'A car search app I built around a conversation: describe your budget and what you need, then browse matching listings from Canadian marketplaces.',
    longDescription: getProjectMarkdown('cargrep'),
    previewImageUrl: '/images/cargrep.png',
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
    highlights: [
      'Startup backed by Shiftkey Labs (Dalhousie University)',
      'Pitched at StFX entrepreneurship competition',
      'Aggregates data from major Canadian marketplaces',
      'Conversational search interface',
      'Real-time deal alerts and price monitoring',
    ],
  },
  {
    slug: 'network-sim',
    title: 'Q-Learning Network Simulator',
    description:
      'A simulator I worked on with Ethan Rozee and Jack Whitmar to compare learning-based routing with Dijkstra and OSPF.',
    longDescription: getProjectMarkdown('network-sim'),
    previewImageUrl: undefined,
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
      'Discrete event simulation using SimPy',
      'Comparative analysis of 3 routing algorithms',
      'Support for multiple network topologies',
      'Performance metrics: throughput, delay, packet loss, link utilization',
      'Adaptive routing decisions based on learned Q-values',
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
