// What the guide can say about how a project was worked out, one short note per topic.
export type CaseTopic =
  | 'problem'
  | 'discovery'
  | 'evidence'
  | 'findings'
  | 'decisions'
  | 'testing'
  | 'architecture'
  | 'team'
  | 'hard'
  | 'status'

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
  casebook?: Partial<Record<CaseTopic, string>>
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
      'Internal operations software built after interviewing the team about what they needed. Staff and Claude share one registry of operations.',
    detail:
      'Eduard leads a team of five developers and designed Keystone’s architecture. The team had stopped using the old scorecard, so Eduard and a UX researcher interviewed leadership, measured actual usage and settled metric definitions before rebuilding. Staff and Claude use the same registry of operations, through the app and through MCP.',
    aliases: ['keystone', 'gtm', 'scorecard', 'revenue', 'operations'],
    outcome: 'I lead the architecture and development. We’re rolling it out now.',
    casebook: {
      problem:
        'Eduard built most of AI-First’s first internal dashboard, and by mid-2026 the team skipped its scorecard in the weekly meeting. Each of its four stages, attract, convert, deliver and collect, squeezed a lot of work into one percentage nobody could act on. His audit also found wrong numbers: the weekly snapshot job had stopped in January, two stages were calculated two different ways, and a finance sync had failed while still logging "completed".',
      discovery:
        'Eduard brought in a UX researcher. She reviewed the old dashboard and comparable firms, then wrote an interview guide for each leadership seat that tested specific options instead of asking for wishes. She wrote the questions and Eduard ran the interviews: a 77-minute one-on-one with the CEO on a 16-question guide, and a 30-question set for the operations and finance lead. Eduard answered his own set on custom development, adoption and reusable IP. The delivery lead’s set was never completed.',
      findings:
        'Every number already had a home: plans in Linear, time in Outlook, money in QuickBooks and signed statements of work in SharePoint. Nobody had written down what makes a lead qualified, what counts as a productized offer or what reusable IP is, and the CEO and the operations lead disagreed on who the company view is for; the decision register logged 13 conflicts like these. There were no recorded project plans to measure against. Time data had to stay system-level, never ranking individuals. The CEO wanted to ask Claude for data rather than browse prebuilt views.',
      evidence:
        'Because people describe a tidier version of how they work, Eduard checked the interviews against behaviour. Eight AI agents measured feature usage read-only in the production database, and he read months of Monday-meeting transcripts to see how project risk was discussed.',
      decisions:
        'The team chose not to build file storage or task lists (SharePoint and Linear keep those), a new time-tracking routine, a copy of the cash forecast (QuickBooks stays the source, read-only), red-amber-green colours without an approved threshold, any view without a meeting that uses it, or an off-the-shelf CRM. Each remaining metric got a contract: an owner, the question it answers, its source, its cadence, and whether it is live or waiting for data. Missing data reads "Data missing", never zero.',
      testing:
        'The researcher turned the findings into a prototype with 25 measures across eight views: leadership, strategy, capacity, delivery, finance, people, tech adoption and reusable IP. She built it in Figma, then in HTML with sample data. After Eduard’s review they widened the definition of reusable IP, gave plans an optimistic, expected and pessimistic range, and tied capacity targets to job roles. Usability sessions with staff on the live build have not happened yet.',
      architecture:
        'Keystone owns no data; it holds SharePoint, Linear, QuickBooks and Outlook together, hence the name. The old dashboard’s MCP tools were hand-written, untested and drifting from the app. In Keystone, each operation is declared once in a capability registry with its input schema and permission, and the Claude tools are generated from it. Claude signs in as the person, so it reaches only what they can, and a parity test checks that the same action from the app and from Claude writes the same record.',
      team: 'Eduard designed the architecture and built the first phase himself: sign-in, the capability registry and the generated Claude tools. Developers on his team built most of what followed, and he reviews and merges their work. The UX researcher owned the research, interview guides, metric register and prototype.',
      hard: 'Definitions are owed by people, not code: several metrics wait for someone to agree a definition or accept ownership, and a metric is cut if its proposed owner declines. Consistent naming of files and projects was a constant fight, and only about half of the old opportunities migrated cleanly. Eduard said in the first brainstorm that change management mattered more than the software.',
      status:
        'Keystone is rolling out in phases. The first scorecard is due at the end of October 2026. The QuickBooks, Linear and SharePoint connectors come in later phases, and the old dashboard runs until cutover, so there are no adoption numbers yet. The code is private.',
    },
    facts: {
      role: 'Engineering lead and architect',
      when: '2026 / rolling out',
      team: 'Eduard with developers from his team, and a UX researcher',
      stack: ['Capability registry', 'MCP', 'Supabase', 'SharePoint', 'Linear', 'QuickBooks'],
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
      'Agent commands, checks and Git hooks for starting projects at AI-First Solutions.',
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
