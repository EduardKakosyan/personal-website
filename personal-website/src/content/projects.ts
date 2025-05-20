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

const allProjects: Project[] = [
  {
    slug: 'healthbyte',
    title: 'HealthByte - Atlantic AI Summit 2025',
    description: 'AI-driven agents to simulate public reactions to healthcare content and combat misinformation',
    longDescription: 'Developed a novel two-agent, reinforcement-style workflow in 60 hours; a Persona Agent, powered by the o4-mini model, loaded diverse profiles to simulate individual reactions (acceptance rate, sentiment, reasoning) to healthcare articles.' +
      'Implemented an Editor Agent that received the Persona Agent\'s feedback, iteratively editing original articles (up to 15 cycles in a reinforcement loop) to improve persuasiveness for specific personas and counter misinformation.',
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
    longDescription: "Developed a no-code AI productivity agent in under 10 hours, leveraging Pinecone's vector database to store and query thousands of academic documents, enabling students to ask questions and receive actionable insights about coursework. Integrated calendar and email functionalities, allowing the agent to summarize upcoming events, schedule new ones, and automate due-date tracking by analyzing syllabi and emails",
    tags: ['N8N'],
    imageUrl: '',
    repoUrl: 'https://github.com/EduardKakosyan/volta_hackathon',
    placement: 'Second Place',
    featured: true
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    description: 'AI-powered car recommendation platform - ShiftKey Build',
    longDescription: "Built secure user management and real‑time data sync using Clerk and Supabase. Integrated Crawl4AI and Azure OpenAI (via Vercel AI SDK) to power an AI assistant that delivers personalized car recommendations. Implemented Stripe payment billing, and deployed on Vercel",
    tags: ['Vercel AI SDK', 'NextJS', 'Supabase'],
    imageUrl: '',
    liveUrl: 'https://www.cargrep.com',
    featured: true
  }
]

// Get all projects
export function getAllProjects(): Project[] {
  return allProjects
}

// Get a project by slug
export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((project) => project.slug === slug)
}

// Get featured projects (for homepage highlights)
export function getFeaturedProjects(limit?: number): Project[] {
  const featured = allProjects.filter(project => project.featured)
  return limit ? featured.slice(0, limit) : featured
}

export default allProjects 