export interface Project {
  slug: string
  title: string
  tier: 'case-study' | 'archive'
  beat?: 'systems' | 'private-local' | 'adoption'
  visibility: 'public-repo' | 'described-only'
  description: string
  detail: string
  aliases: string[]
  outcome?: string
  facts: {
    role: string
    when: string
    team: string
    stack: string[]
    links: { label: string; href: string }[]
  }
}

export const projects: Project[] = [
  {
    slug: 'volta-sep26',
    title: 'Is the Beach Open',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A map of supervised beaches around Halifax, with public notices behind each swimming status.',
    detail:
      'Built at a Volta hackathon, September 12-14, 2026, with Harshil-varia (GitHub). Distinct from the earlier Second Brain project. The repository documents fixture and live modes, source-page tests and mobile browser checks. The competition outcome is not recorded.',
    aliases: ['beach open', 'new volta', 'volta-sep26'],
    facts: {
      role: 'Builder',
      when: 'Volta hackathon, September 2026',
      team: 'Eduard and @Harshil-varia',
      stack: ['Next.js', 'MapLibre', 'Supabase', 'Vitest', 'Playwright'],
      links: [
        {
          label: 'Source code',
          href: 'https://github.com/EduardKakosyan/claude-hackathon-volta-sep26',
        },
      ],
    },
  },
  {
    slug: 'exosky',
    title: 'Sky Painters',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'An educational sky explorer that changes the viewpoint from Earth to an exoplanet and lets visitors draw constellations.',
    detail:
      'Built for NASA Space Apps Challenge 2024 with Huy Huynh, Hao Tang and quangphucthan (GitHub). Eduard worked on the constellation drawing, the interface and the Docker setup. The repository describes Gaia and NASA Exoplanet Archive data, coordinate transformations and a React sky viewer. The competition outcome is not recorded.',
    aliases: ['exosky', 'sky painters', 'nasa'],
    facts: {
      role: 'Team contributor',
      when: 'NASA Space Apps Challenge 2024',
      team: 'Huy Huynh, Hao Tang, @quangphucthan and Eduard',
      stack: ['React', 'Three.js', 'TypeScript', 'Python', 'PostgreSQL', 'Docker'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/exosky_nasa' }],
    },
  },
  {
    slug: 'keystone',
    title: 'Keystone',
    tier: 'case-study',
    beat: 'systems',
    visibility: 'described-only',
    description:
      'An internal platform that connects SharePoint, Linear and QuickBooks. Staff and AI agents use the same operations.',
    detail:
      'Eduard leads Keystone’s architecture and development with a team of five developers. A UX research contractor worked with him to understand what the team needed. The system connects SharePoint, Linear and QuickBooks and exposes operations through MCP. The old metrics were inaccurate and rarely used. Keystone is rolling out; adoption has not been measured yet.',
    aliases: ['keystone', 'gtm', 'scorecard', 'revenue', 'operations'],
    outcome: 'I lead the architecture and development. We’re rolling it out now.',
    facts: {
      role: 'Engineering lead and architect',
      when: '2026 / rolling out',
      team: 'Team of five developers led by Eduard, with a UX research contractor',
      stack: ['Capability registry', 'MCP', 'SharePoint', 'Linear', 'QuickBooks'],
      links: [],
    },
  },
  {
    slug: 'keeper',
    title: 'Keeper',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'described-only',
    description:
      'A private archive for meeting transcripts, with search, summaries and access from AI tools. Comes with a Mac app for recording and dictation.',
    detail:
      'Keeper stores transcripts and summary versions in SQLite, serves a web UI and MCP tools, and can summarize with a configured local model. Access is scoped to the person whose token is on the request. The repository remains private pending its publication audit.',
    aliases: ['keeper', 'meeting', 'archive', 'dictation'],
    outcome: 'Search results link back to the transcript and timestamp.',
    facts: {
      role: 'Builder',
      when: 'October 2026',
      team: 'Personal project',
      stack: ['Python', 'FastAPI', 'SQLite FTS5', 'MCP', 'Swift'],
      links: [],
    },
  },
  {
    slug: 'dgx-autonomy',
    title: 'dgx-autonomy',
    tier: 'case-study',
    beat: 'private-local',
    visibility: 'public-repo',
    description:
      'A setup for running a coding agent on a DGX Spark. It saves progress between conversations and submits its code to tests it cannot edit.',
    detail:
      'Eduard built the controller around OpenHands to save progress, recover interrupted runs, test code in a separate container, and pause for review. Recent app runs use SGLang and NVFP4; llama.cpp and a Qwen3.6 fallback are also supported. Shoreline and the original Camp Yahtzee release are documented outputs. Human and Claude supervision supplied product briefs and reviews.',
    aliases: ['dgx', 'autonomy', 'autonomous loops', 'local ai', 'qwen', 'spark'],
    outcome:
      'Shoreline and the first Camp Yahtzee release were built with this setup, with briefs and reviews from me and Claude.',
    facts: {
      role: 'Build controller and tests',
      when: '2026',
      team: 'Eduard; local builder with human and Claude supervision',
      stack: ['Qwen3.8', 'DGX Spark', 'OpenHands', 'SGLang', 'Python', 'Docker'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/dgx-autonomy' }],
    },
  },
  {
    slug: 'shoreline',
    title: 'Shoreline',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'Weather, tides and sea conditions for a day at the water, built by a local coding agent.',
    detail:
      'Built September 24-28, 2026 over three runs. The final run passed 19/19 fixed acceptance checks. The operator supplied briefs and product reviews. Data comes from Open-Meteo.',
    aliases: ['shoreline', 'beach', 'fishing'],
    facts: {
      role: 'Briefs and review',
      when: 'September 2026',
      team: 'Local coding agent with operator supervision',
      stack: ['Local AI', 'Open-Meteo', 'Playwright'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/shoreline' },
        { label: 'Live app', href: 'https://eduardkakosyan.github.io/shoreline/' },
      ],
    },
  },
  {
    slug: 'yahtzee',
    title: 'Camp Yahtzee',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'An offline game for one phone passed around a camp table, with real or on-screen dice.',
    detail:
      'The original local-agent build crossed four conversations and two product reviews, passing 24/24 fixed acceptance checks. Its rules audit covered all 7,776 rolls. Later undo, reset and game-management controls were added separately through CodeLayer.',
    aliases: ['yahtzee', 'dice', 'camp'],
    facts: {
      role: 'Briefs and review',
      when: 'September 2026',
      team: 'Local coding agent with operator supervision',
      stack: ['Local AI', 'Offline', 'Playwright'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/yahtzee' },
        { label: 'Live app', href: 'https://eduardkakosyan.github.io/yahtzee/' },
      ],
    },
  },
  {
    slug: 'hugo',
    title: 'HUGO',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A voice assistant for a Reachy Mini robot, running speech recognition, reasoning, tools and synthesis on a DGX Spark.',
    detail:
      'HUGO uses Nemotron through vLLM, Parakeet, Qwen3-TTS, openWakeWord and Silero VAD. The voice loop streams speech and supports follow-up conversation. This is a newer Python/DGX implementation than the original Go version.',
    aliases: ['hugo', 'reachy', 'robot', 'voice'],
    facts: {
      role: 'Builder',
      when: '2026',
      team: 'Solo',
      stack: ['Python', 'DGX Spark', 'Reachy Mini', 'vLLM', 'Voice'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/hugo' }],
    },
  },
  {
    slug: 'claude-autonomous',
    title: 'Claude Autonomous',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'An earlier harness for running Claude Code overnight in an isolated Docker container.',
    detail:
      'Scheduling, budget controls and persistent task state came before the fully local dgx-autonomy environment.',
    aliases: ['claude autonomous'],
    facts: {
      role: 'Builder',
      when: 'March 2026',
      team: 'Solo',
      stack: ['Docker', 'Bash', 'Claude Code', 'launchd'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/claude-autonomous' },
      ],
    },
  },
  {
    slug: 'voxcoach',
    title: 'VoxCoach',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'Sales-call practice with a simulated buyer and a review afterwards, using local voice and language models on Apple Silicon.',
    detail:
      'The voice loop overlaps language generation and speech synthesis, supports barge-in and scores the conversation afterwards. Built with the earlier Claude Autonomous harness.',
    aliases: ['voxcoach', 'sales calls'],
    facts: {
      role: 'Builder',
      when: 'March 2026',
      team: 'Solo, using Claude Code',
      stack: ['Go', 'voxtral.c', 'Silero VAD', 'Qwen 3', 'Kokoro TTS', 'Ollama'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/voxcoach' }],
    },
  },
  {
    slug: 'dev-template',
    title: 'Dev Template',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'Agent commands, checks and Git hooks for starting projects at AI-First Consulting.',
    detail:
      'Planning, implementation and review commands, plus saved notes between sessions and development checks.',
    aliases: ['dev template'],
    facts: {
      role: 'Builder',
      when: '2026',
      team: 'Solo',
      stack: ['TypeScript', 'Claude Code', 'Vitest', 'Husky', 'Gitleaks'],
      links: [
        { label: 'Source code', href: 'https://github.com/AI-First-Consulting/dev-template' },
      ],
    },
  },
  {
    slug: 'healthbyte',
    title: 'HealthByte',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A hackathon prototype where one agent simulates readers’ responses to a healthcare article and another revises the text.',
    detail:
      'Eduard built it with Huy Huynh, Hao Tang and Tobi Onibudo. Their team took first place at the Atlantic AI Summit 2025. One agent simulates readers; another revises the article.',
    aliases: ['healthbyte', 'health', 'hackathon'],
    facts: {
      role: 'Team contributor',
      when: 'May 2025',
      team: 'Four-person hackathon team',
      stack: ['Python', 'Agents', 'Reinforcement Learning'],
      links: [
        {
          label: 'Source code',
          href: 'https://github.com/EduardKakosyan/atlantic-ai-conference-hackathon',
        },
        { label: 'Live demo', href: 'https://healthbyte-dashboard.vercel.app/' },
      ],
    },
  },
  {
    slug: 'second-brain',
    title: 'Second Brain',
    tier: 'archive',
    visibility: 'public-repo',
    description:
      'A hackathon study assistant connecting course files in Google Drive with chat and a calendar.',
    detail:
      'Eduard built it with Huy Huynh and Hao Tang at the 2024 Volta Hackathon, where their team took second place.',
    aliases: ['second brain', 'volta'],
    facts: {
      role: 'Team contributor',
      when: '2024',
      team: 'Three-person hackathon team',
      stack: ['n8n', 'Pinecone', 'Google Drive API', 'RAG'],
      links: [{ label: 'Source code', href: 'https://github.com/EduardKakosyan/volta_hackathon' }],
    },
  },
  {
    slug: 'cargrep',
    title: 'CarGrep',
    tier: 'archive',
    visibility: 'described-only',
    description:
      'A car search app built around a conversation about your budget and what you need.',
    detail:
      'Searches Canadian marketplaces and tracks prices. Backed by ShiftKey Labs at Dalhousie.',
    aliases: ['cargrep', 'cars'],
    facts: {
      role: 'Co-founder and builder',
      when: '2024',
      team: 'Solo build',
      stack: ['Next.js', 'Vercel AI SDK', 'Azure OpenAI', 'Supabase', 'TypeScript'],
      links: [{ label: 'Website', href: 'https://www.cargrep.com' }],
    },
  },
  {
    slug: 'network-sim',
    title: 'Q-Learning Network Simulator',
    tier: 'archive',
    visibility: 'public-repo',
    description: 'A network simulation comparing learning-based routing with Dijkstra and OSPF.',
    detail:
      'Research with Ethan Rozee and Jack Whitmar, using Python, SimPy and NetworkX across network topologies and traffic patterns.',
    aliases: ['network', 'routing', 'q-learning'],
    facts: {
      role: 'Research contributor',
      when: '2024',
      team: 'Three-person team',
      stack: ['Python', 'SimPy', 'NetworkX', 'Q-Learning'],
      links: [
        { label: 'Source code', href: 'https://github.com/EduardKakosyan/q-learning-network-sim' },
      ],
    },
  },
]

export const caseStudies = projects.filter((project) => project.tier === 'case-study')
export const archiveProjects = projects.filter((project) => project.tier === 'archive')
export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}
export default projects
