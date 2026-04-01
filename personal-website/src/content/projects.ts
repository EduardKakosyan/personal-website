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
      'Full-stack consulting business health platform tracking Attract, Convert, Deliver, and Collect cycles with real-time gauges, pipeline financials, team utilization, website analytics, LinkedIn analytics, and client sentiment — all in one unified dashboard.',
    longDescription: getProjectMarkdown('acdc-dashboard'),
    previewImageUrl: '/images/acdc-dashboard.png',
    liveUrl: 'https://dashboard-demo-aifirst.vercel.app/',
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
      'PostHog',
      'Tailwind CSS',
    ],
    featured: true,
    category: 'Full-Stack',
    completionDate: '2025',
    teamSize: 1,
    duration: 'Ongoing',
    highlights: [
      '8 modules: Dashboard, Team & Calendar, Network, Organizations, Opportunities, Projects, Time Entries, Finances',
      'Real-time ACDC health gauges with 4-week and YTD trend tracking',
      'Pipeline financials with pre/post-proposal expected value',
      'Team utilization overview with client & category breakdowns',
      'Website analytics (PostHog) and LinkedIn analytics in one view',
    ],
  },
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
    featured: true,
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
      'Voice-first agent platform written in Go for Reachy Mini robot. Concurrent voice pipeline where the agent talks to you while it works, not after. Local VAD, STT, and TTS with barge-in support.',
    longDescription: getProjectMarkdown('hugo'),
    previewImageUrl: undefined,
    tags: [
      'Go',
      'tRPC-agent-go',
      'Claude Sonnet 4',
      'Silero VAD',
      'Moonshine STT',
      'Kokoro TTS',
      'WebSocket',
      'Reachy Mini',
      'ONNX Runtime',
    ],
    repoUrl: 'https://github.com/EduardKakosyan/hugo',
    featured: true,
    category: 'AI/ML',
    completionDate: '2026',
    teamSize: 1,
    duration: 'Ongoing',
    highlights: [
      'Streaming ReAct agent with concurrent voice pipeline in Go',
      'All-local voice processing: Silero VAD, Moonshine STT, Kokoro TTS',
      'Overlapped execution — agent thinks while TTS synthesizes',
      'WebSocket server with structured message protocol',
      'Barge-in support via context cancellation propagation',
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
