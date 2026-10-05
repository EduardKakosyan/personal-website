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
      'Open-source harness for running Claude Code as a long-running autonomous agent in an isolated Docker container. Nightly launchd scheduling, $100/day budget controls, container firewall, and persistent task state across runs.',
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
      'Successfully built VoxCoach end-to-end (47 tasks, 10 phases)',
    ],
  },
  {
    slug: 'voxcoach',
    title: 'VoxCoach',
    description:
      'Voice sales training platform that simulates realistic discovery calls with LLM-driven buyer personas. Runs 100% locally on Apple Silicon with sub-800ms voice latency, 6-phase call flow, and post-call scoring.',
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
      '100% offline voice pipeline on Apple Silicon (<800ms latency)',
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
      'Open source tooling-only starter template for building with Claude Code. Pre-configured with 6 specialized sub-agents, 30+ slash commands, three-layer git hook protection, CI/CD, and a persistent knowledge base.',
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
      'Three-layer git hook protection (secrets, lint, local CI)',
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
      'Simulates how different demographics react to healthcare content before publication. Uses a two-agent reinforcement learning loop to iteratively improve messaging for diverse audiences.',
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
      'Won 1st place among 20 university teams',
      'Two-agent reinforcement learning loop (persona + editor)',
      'Persona modeling across diverse demographics',
      'Iterative content optimization with convergence tracking',
    ],
  },
  {
    slug: 'second-brain',
    title: 'Second Brain',
    description:
      'Time management and study assistant for university students. Connects to Google Drive and calendar to automatically process academic documents and schedule study sessions.',
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
      'Car recommendation startup backed by Shiftkey Labs (Dalhousie University). Describe what you need in plain English, and the platform finds deals across Canadian marketplaces — no vehicle knowledge required.',
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
      'Network simulation comparing Q-routing (reinforcement learning) against Dijkstra and OSPF across different topologies and traffic patterns.',
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
